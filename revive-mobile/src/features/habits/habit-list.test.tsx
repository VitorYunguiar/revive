import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import HabitsScreen from '../../../app/(app)/(tabs)/habits';
jest.mock('expo-router', () => ({ Link: ({ children }: React.PropsWithChildren) => children }));
jest.mock('lucide-react-native', () => ({ Plus: () => null, Eye: () => null, EyeOff: () => null }));
jest.mock('@/features/bootstrap/use-bootstrap', () => ({ useBootstrap: () => ({ data: { vicios: [
  { id: 'a', nome_vicio: 'Active', data_inicio: '2026-10-01', ativo: true },
  { id: 'b', nome_vicio: 'Archived', data_inicio: '2026-10-01', ativo: false },
] }, isLoading: false }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
test('lists only active habits by default and preserves access to archived details', async () => {
  await render(<HabitsScreen />);
  expect(screen.getByText('Active')).toBeTruthy();
  expect(screen.queryByText('Archived')).toBeNull();
  await fireEvent.press(screen.getByText('Mostrar hábitos arquivados'));
  expect(screen.getByText('Archived')).toBeTruthy();
  expect(screen.queryByText('Active')).toBeNull();
  expect(screen.getByText('Arquivado · histórico preservado')).toBeTruthy();
});
