import React from 'react';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import NewHabitScreen from '../../app/(app)/habits/new';
import { reviveApi } from '@/core/api/repositories';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('@/core/api/repositories', () => ({ reviveApi: { createAddiction: jest.fn(async () => ({})) } }));
jest.mock('@/core/query/client', () => ({ queryClient: { invalidateQueries: jest.fn(async () => undefined) } }));
jest.mock('@/features/auth/session-context', () => ({ useSession: () => ({ user: { id: 'test-user' } }) }));
jest.mock('@/features/bootstrap/use-bootstrap', () => ({ bootstrapKey: (id: string) => ['bootstrap', id] }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('lucide-react-native', () => ({ CalendarDays: () => null, ChevronDown: () => null, ChevronLeft: () => null, ChevronRight: () => null, X: () => null, Eye: () => null, EyeOff: () => null }));

beforeEach(() => { jest.clearAllMocks(); });

test('salva a data escolhida sem deslocamento e converte reais para o contrato da API', async () => {
  await render(<NewHabitScreen />);
  await fireEvent.changeText(screen.getByLabelText('Hábito ou vício'), 'Refrigerante');
  await fireEvent.changeText(screen.getByLabelText('Data de início'), '29022024');
  await fireEvent.changeText(screen.getByLabelText('Economia por dia (R$)'), '1.234,56');
  await fireEvent.press(screen.getByText('Salvar hábito'));
  await waitFor(() => expect(reviveApi.createAddiction).toHaveBeenCalledWith({ nome_vicio: 'Refrigerante', data_inicio: '2024-02-29', valor_economizado_por_dia: 1234.56 }));
});

test('mostra erros de data e dinheiro sem enviar dados inválidos', async () => {
  await render(<NewHabitScreen />);
  await fireEvent.changeText(screen.getByLabelText('Hábito ou vício'), 'Refrigerante');
  await fireEvent.changeText(screen.getByLabelText('Data de início'), '31022024');
  await fireEvent.changeText(screen.getByLabelText('Economia por dia (R$)'), '-5');
  await fireEvent.press(screen.getByText('Salvar hábito'));
  await waitFor(() => expect(screen.getByText('Informe uma data válida: DD/MM/AAAA.')).toBeTruthy());
  expect(screen.getByText('Informe um valor positivo ou zero, com até 2 casas decimais.')).toBeTruthy();
  expect(reviveApi.createAddiction).not.toHaveBeenCalled();
});
