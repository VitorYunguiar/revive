import React from 'react';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HabitManagement } from './habit-management';
import { updateHabit } from './manage-habit';
import { ApiError } from '@/core/api/errors';
import type { Addiction } from '@/domain/types';
import NetInfo from '@react-native-community/netinfo';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('./manage-habit', () => ({ updateHabit: jest.fn() }));
jest.mock('@/core/api/repositories', () => ({ reviveApi: { bootstrap: jest.fn() } }));
jest.mock('@/core/auth/token-store', () => ({ tokenStore: { getGeneration: () => 1, isCurrent: () => true, getUser: async () => ({ id: 'a' }) } }));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('lucide-react-native', () => ({ CalendarDays: () => null, ChevronDown: () => null, ChevronLeft: () => null, ChevronRight: () => null, X: () => null, Eye: () => null, EyeOff: () => null }));
const habit: Addiction = { id: 'h', usuario_id: 'a', nome_vicio: 'Synthetic', data_inicio: '2026-10-01', valor_economizado_por_dia: 10, revision: 3, ativo: true, inicio_editavel: false };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(updateHabit).mockResolvedValue(habit);
  jest.mocked(NetInfo.addEventListener).mockImplementation(callback => { callback({ isConnected: true, isInternetReachable: true } as never); return () => {}; });
});
test('saves pt-BR money with the revision and omits an unchanged restricted start date', async () => {
  await render(<HabitManagement habit={habit} userId="a" />);
  await fireEvent.changeText(screen.getByLabelText('Nome do hábito'), 'Café');
  await fireEvent.changeText(screen.getByLabelText('Economia diária (R$)'), '1.234,56');
  await fireEvent.press(screen.getByText('Salvar alterações'));
  await waitFor(() => expect(updateHabit).toHaveBeenCalledWith('a', 'h', { revision: 3, nome_vicio: 'Café', valor_economizado_por_dia: 1234.56 }));
});
test('keeps the draft and shows a recoverable conflict instead of announcing success', async () => {
  jest.mocked(updateHabit).mockRejectedValue(new ApiError('Recarregue os dados e revise sua edição.', 409, 'REVISAO_CONFLITO'));
  await render(<HabitManagement habit={habit} userId="a" />);
  await fireEvent.changeText(screen.getByLabelText('Nome do hábito'), 'Meu rascunho');
  await fireEvent.press(screen.getByText('Salvar alterações'));
  await waitFor(() => expect(screen.getByText('Recarregue os dados e revise sua edição.')).toBeTruthy());
  expect(screen.getByDisplayValue('Meu rascunho')).toBeTruthy();
  expect(screen.queryByText('Alteração confirmada. O histórico e as metas foram preservados.')).toBeNull();
});
test('disables editing while offline and offers reactivation for an archived habit', async () => {
  jest.mocked(NetInfo.addEventListener).mockImplementation(callback => { callback({ isConnected: false } as never); return () => {}; });
  await render(<HabitManagement habit={{ ...habit, ativo: false }} userId="a" />);
  await fireEvent.press(screen.getByText('Reativar hábito'));
  await fireEvent.press(screen.getByText('Salvar alterações'));
  expect(updateHabit).not.toHaveBeenCalled();
  expect(screen.getByText('Conecte-se para editar, arquivar ou reativar. Nenhuma edição será salva offline.')).toBeTruthy();
});
