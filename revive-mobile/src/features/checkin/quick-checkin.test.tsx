import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { useSession } from '@/features/auth/session-context';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { useReviveMutations } from '@/features/mutations/use-revive-mutations';
import { getPendingMutations } from '@/core/storage/database';
import { tokenStore } from '@/core/auth/token-store';
import { localDateKey } from '@/domain/formats';
import type { BootstrapData } from '@/domain/types';
import { QuickCheckin } from './quick-checkin';
import { checkinSelection } from './selection-preferences';

const mockPush = jest.fn();
const mockCreate = jest.fn<ReturnType<typeof useReviveMutations>['createRecordWithReceipt']>();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('lucide-react-native', () => ({ Eye: () => null, EyeOff: () => null }));
jest.mock('@/features/auth/session-context', () => ({ useSession: jest.fn() }));
jest.mock('@/features/bootstrap/use-bootstrap', () => ({ useBootstrap: jest.fn() }));
jest.mock('@/features/mutations/use-revive-mutations', () => ({ useReviveMutations: () => ({ createRecordWithReceipt: mockCreate }) }));
jest.mock('@/core/storage/database', () => ({ getPendingMutations: jest.fn() }));
jest.mock('@/core/auth/token-store', () => ({ tokenStore: { getGeneration: () => 1, isCurrent: jest.fn(() => true) } }));
jest.mock('./selection-preferences', () => ({ checkinSelection: { get: jest.fn(), set: jest.fn() } }));

const fixture = (count = 1, account = 'a'): BootstrapData => ({
  usuario: { id: account, nome: 'Pessoa', email: 'test@example.invalid' }, server_time: new Date().toISOString(),
  vicios: Array.from({ length: count }, (_, index) => ({ id: `h${index}`, usuario_id: account, nome_vicio: `Hábito ${index}`, data_inicio: '2026-01-01' })),
  registros: [], recaidas: [], metas: [], mensagem: null,
});
const snapshot = (data: BootstrapData) => {
  jest.mocked(useSession).mockReturnValue({ user: data.usuario, isRestoring: false } as ReturnType<typeof useSession>);
  jest.mocked(useBootstrap).mockReturnValue({ data } as ReturnType<typeof useBootstrap>);
};
const chooseMood = async () => {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar check-in' })).toBeDisabled());
  await fireEvent.press(screen.getByLabelText('Humor: Bem'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar check-in' })).toBeEnabled());
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  jest.mocked(tokenStore.isCurrent).mockReturnValue(true);
  jest.mocked(checkinSelection.get).mockResolvedValue(null);
  jest.mocked(checkinSelection.set).mockResolvedValue();
  mockCreate.mockResolvedValue({ id: 'intent', status: 'queued' });
  jest.mocked(getPendingMutations).mockResolvedValue([{ id: 'intent', status: 'pending' }] as never);
  snapshot(fixture());
});

it('saves from the Journey with one mood, no typing, and shows the durable receipt', async () => {
  await render(<QuickCheckin />);
  expect(screen.queryByLabelText('Gatilhos (opcional)')).toBeNull();
  await chooseMood();
  await fireEvent.press(screen.getByText('Salvar check-in'));
  expect(mockCreate).toHaveBeenCalledWith({ vicio_id: 'h0', humor: 'Bem', data_registro: localDateKey(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, gatilhos: undefined, conquistas: undefined, observacoes: undefined });
  expect(screen.getByText('Salvo no aparelho. Aguardando sincronização.')).toBeTruthy();
  expect(screen.queryByText('Salvar check-in')).toBeNull();
});

it('selects and remembers habits beyond the first three, excluding archived/foreign ones', async () => {
  const data = fixture(5);
  data.vicios[3]!.ativo = false;
  data.vicios.push({ id: 'foreign', usuario_id: 'b', nome_vicio: 'Outra conta', data_inicio: '2026-01-01' });
  snapshot(data);
  await render(<QuickCheckin />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Escolher hábito' })).toBeEnabled());
  await fireEvent.press(screen.getByText('Escolher hábito'));
  expect(screen.queryByLabelText('Hábito 3')).toBeNull();
  expect(screen.queryByLabelText('Outra conta')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Hábito 4'));
  expect(checkinSelection.set).toHaveBeenCalledWith('a', 'h4');
  await chooseMood();
  await fireEvent.press(screen.getByText('Salvar check-in'));
  expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ vicio_id: 'h4' }));
});

it('restores a per-account choice and safely falls back when it is no longer active', async () => {
  snapshot(fixture(5));
  jest.mocked(checkinSelection.get).mockResolvedValue('h4');
  const view = await render(<QuickCheckin />);
  await waitFor(() => expect(screen.getByText('Hábito: Hábito 4')).toBeTruthy());
  const second = fixture(2, 'b');
  jest.mocked(checkinSelection.get).mockResolvedValue('h4');
  snapshot(second);
  await view.rerender(<QuickCheckin />);
  await waitFor(() => expect(checkinSelection.get).toHaveBeenCalledWith('b'));
  expect(screen.getByText('Hábito: Hábito 0')).toBeTruthy();
});

it('offers the existing registration for zero active habits', async () => {
  const data = fixture(); data.vicios[0]!.ativo = false;
  snapshot(data);
  await render(<QuickCheckin />);
  await fireEvent.press(screen.getByText('Adicionar hábito'));
  expect(mockPush).toHaveBeenCalledWith('/(app)/habits/new');
  expect(mockCreate).not.toHaveBeenCalled();
});

it('preserves optional fields across collapse and displays them in today’s history', async () => {
  await render(<QuickCheckin />);
  await chooseMood();
  await fireEvent.press(screen.getByText('Adicionar reflexão (opcional)'));
  await fireEvent.changeText(screen.getByLabelText('Gatilhos (opcional)'), 'Texto sintético');
  await fireEvent.changeText(screen.getByLabelText('Conquistas (opcional)'), 'Conquista sintética');
  await fireEvent.changeText(screen.getByLabelText('Observações (opcional)'), 'Observação sintética');
  await fireEvent.press(screen.getByText('Recolher reflexão opcional'));
  await fireEvent.press(screen.getByText('Adicionar reflexão (opcional)'));
  expect(screen.getByLabelText('Gatilhos (opcional)').props.value).toBe('Texto sintético');
  await fireEvent.press(screen.getByText('Recolher reflexão opcional'));
  await fireEvent.press(screen.getByText('Salvar check-in'));
  await fireEvent.press(screen.getByText('Consultar check-ins de hoje'));
  expect(screen.getByText('Gatilhos: Texto sintético')).toBeTruthy();
  expect(screen.getByText('Conquistas: Conquista sintética')).toBeTruthy();
  expect(screen.getByText('Observações: Observação sintética')).toBeTruthy();
});

it('requires an explicit new record for today and never saves merely by opening again', async () => {
  const data = fixture();
  data.registros.push({ id: 'existing', vicio_id: 'h0', data_registro: localDateKey(), humor: 'Confiante', pending: true });
  snapshot(data);
  await render(<QuickCheckin />);
  expect(screen.queryByText('Salvar check-in')).toBeNull();
  expect(mockCreate).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Consultar check-ins de hoje'));
  expect(screen.getByText('Check-in: Confiante')).toBeTruthy();
  await fireEvent.press(screen.getByText('Registrar outro check-in'));
  await chooseMood();
  await fireEvent.press(screen.getByText('Salvar check-in'));
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(data.registros).toHaveLength(1);
});

it('blocks rapid duplicate taps while SQLite persistence is in flight', async () => {
  let resolve!: (value: { id: string; status: 'queued' }) => void;
  mockCreate.mockImplementation(() => new Promise(done => { resolve = done; }));
  await render(<QuickCheckin />);
  await chooseMood();
  const button = screen.getByText('Salvar check-in');
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Salvar check-in' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Adicionar reflexão (opcional)' })).toBeDisabled();
  await act(async () => resolve({ id: 'intent', status: 'queued' }));
  expect(screen.queryByText('Salvar check-in')).toBeNull();
});

it('keeps all inputs when local persistence fails and permits a deliberate retry', async () => {
  mockCreate.mockRejectedValueOnce(new Error('SQLite unavailable'));
  await render(<QuickCheckin />);
  await chooseMood();
  await fireEvent.press(screen.getByText('Adicionar reflexão (opcional)'));
  await fireEvent.changeText(screen.getByLabelText('Observações (opcional)'), 'Texto sintético mantido');
  await fireEvent.press(screen.getByText('Salvar check-in'));
  expect(screen.getByLabelText('Observações (opcional)').props.value).toBe('Texto sintético mantido');
  expect(screen.getByText(/Seus campos foram mantidos/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Salvar check-in'));
  expect(mockCreate).toHaveBeenCalledTimes(2);
});

it('shows recoverable sync failures without inviting a second creation', async () => {
  mockCreate.mockResolvedValue({ id: 'intent', status: 'failed' });
  jest.mocked(getPendingMutations).mockResolvedValue([{ id: 'intent', status: 'failed' }] as never);
  await render(<QuickCheckin />);
  await chooseMood();
  await fireEvent.press(screen.getByText('Salvar check-in'));
  expect(screen.getByText(/A sincronização falhou/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Ver pendências de sincronização'));
  expect(mockPush).toHaveBeenCalledWith('/(app)/sync');
  expect(mockCreate).toHaveBeenCalledTimes(1);
});

it('does not claim synchronization merely because a pending intent left the queue', async () => {
  jest.mocked(getPendingMutations).mockResolvedValue([]);
  await render(<QuickCheckin />);
  await chooseMood();
  await fireEvent.press(screen.getByText('Salvar check-in'));
  await waitFor(() => expect(screen.getByText(/A intenção saiu da fila/)).toBeTruthy());
  expect(screen.queryByText('Check-in sincronizado.')).toBeNull();
  expect(screen.getByText('Consultar histórico')).toBeTruthy();
});

it('shows an acknowledged server receipt as synchronized', async () => {
  mockCreate.mockResolvedValue({ id: 'intent', status: 'synced' });
  jest.mocked(getPendingMutations).mockResolvedValue([]);
  await render(<QuickCheckin />);
  await chooseMood();
  await fireEvent.press(screen.getByText('Salvar check-in'));
  expect(screen.getByText('Check-in sincronizado.')).toBeTruthy();
});

it('rejects a previous account snapshot and clears drafts on account change', async () => {
  const view = await render(<QuickCheckin />);
  await chooseMood();
  await fireEvent.press(screen.getByText('Adicionar reflexão (opcional)'));
  await fireEvent.changeText(screen.getByLabelText('Observações (opcional)'), 'Texto da conta A');
  jest.mocked(useSession).mockReturnValue({ user: fixture(1, 'b').usuario, isRestoring: false } as ReturnType<typeof useSession>);
  await view.rerender(<QuickCheckin />);
  expect(screen.queryByText('Check-in rápido')).toBeNull();
  snapshot(fixture(1, 'b'));
  await view.rerender(<QuickCheckin />);
  expect(screen.queryByLabelText('Observações (opcional)')).toBeNull();
  expect(mockCreate).not.toHaveBeenCalled();
});

it('does not publish a late receipt after a session change', async () => {
  let resolve!: (value: { id: string; status: 'synced' }) => void;
  mockCreate.mockImplementation(() => new Promise(done => { resolve = done; }));
  await render(<QuickCheckin />);
  await chooseMood();
  await fireEvent.press(screen.getByText('Salvar check-in'));
  jest.mocked(tokenStore.isCurrent).mockReturnValue(false);
  await act(async () => resolve({ id: 'intent', status: 'synced' }));
  expect(screen.queryByText('Check-in sincronizado.')).toBeNull();
});
