import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { SessionProvider, useSession } from './session-context';
import { authRequest } from '@/core/api/client';
import { reviveApi } from '@/core/api/repositories';
import { cancelAccountReminders, deleteReminderPreference, setReminderAccount } from '@/core/notifications/reminders';
import { countPendingMutations, clearUserData } from '@/core/storage/database';
import type { AuthSession, User } from '@/domain/types';

let mockGeneration = 0;
let mockStoredUser: User | null;
const mockClear = jest.fn<(expected: number) => Promise<boolean>>();
jest.mock('@/core/auth/token-store', () => ({ tokenStore: {
  getGeneration: () => mockGeneration,
  isCurrent: (expected: number) => expected === mockGeneration,
  beginSessionChange: () => ++mockGeneration,
  getRefreshToken: async () => 'synthetic-refresh',
  getUser: async () => mockStoredUser,
  saveSession: async (expected: number, session: AuthSession) => {
    if (expected !== mockGeneration) return false;
    mockStoredUser = session.usuario; return true;
  },
  clear: (expected: number) => mockClear(expected),
} }));
jest.mock('@/core/api/client', () => ({ authRequest: jest.fn(), refreshAccessToken: jest.fn(), setSessionExpiredHandler: jest.fn() }));
jest.mock('@/core/api/repositories', () => ({ reviveApi: { logout: jest.fn(), deleteAccount: jest.fn() } }));
jest.mock('@/core/notifications/reminders', () => ({ cancelAccountReminders: jest.fn(), deleteReminderPreference: jest.fn(), setReminderAccount: jest.fn() }));
jest.mock('@/core/storage/database', () => ({ countPendingMutations: jest.fn(), clearUserData: jest.fn() }));
jest.mock('@/core/privacy/lock-service', () => ({ privacyLockPreferences: { clear: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) }, privacyScreenProtection: { disable: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) } }));
jest.mock('@/core/query/client', () => ({ queryClient: { clear: jest.fn() } }));
jest.mock('@/features/checkin/selection-preferences', () => ({ checkinSelection: { clear: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) } }));

let session!: ReturnType<typeof useSession>;
function Probe() {
  const value = useSession();
  useEffect(() => { session = value; }, [value]);
  return <Text>{value.user?.id ?? 'signed-out'}</Text>;
}
async function mount() {
  const view = await render(<SessionProvider><Probe /></SessionProvider>);
  await waitFor(() => expect(session.isRestoring).toBe(false));
  return view;
}
beforeEach(() => {
  jest.clearAllMocks(); mockGeneration = 0;
  mockStoredUser = { id: 'a', nome: 'Synthetic A', email: 'a@example.invalid' };
  jest.mocked(cancelAccountReminders).mockReset().mockResolvedValue(undefined);
  jest.mocked(deleteReminderPreference).mockResolvedValue(undefined);
  jest.mocked(countPendingMutations).mockResolvedValue(0);
  jest.mocked(clearUserData).mockResolvedValue(undefined);
  jest.mocked(reviveApi.logout).mockResolvedValue(undefined);
  jest.mocked(reviveApi.deleteAccount).mockResolvedValue(undefined);
  jest.mocked(authRequest).mockResolvedValue({ access_token: 'synthetic', refresh_token: 'synthetic', expires_in: 60, usuario: { id: 'b', nome: 'Synthetic B', email: 'b@example.invalid' } });
  mockClear.mockImplementation(async expected => {
    if (mockGeneration !== expected) return false;
    mockGeneration++; mockStoredUser = null; return true;
  });
});

it('cancels the old account before authenticating and only then opens the new account gate', async () => {
  await mount();
  let finish!: () => void;
  jest.mocked(cancelAccountReminders).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  let signingIn!: Promise<void>;
  await act(async () => { signingIn = session.signIn('b@example.invalid', 'synthetic'); });
  expect(setReminderAccount).toHaveBeenLastCalledWith(null);
  expect(authRequest).not.toHaveBeenCalled();
  await act(async () => { finish(); await signingIn; });
  expect(session.user?.id).toBe('b');
  expect(setReminderAccount).toHaveBeenLastCalledWith('b');
});

it('does not log out or clear the session when native cancellation fails', async () => {
  await mount();
  jest.mocked(cancelAccountReminders).mockRejectedValueOnce(new Error('native failure'));
  await act(async () => { await expect(session.signOut()).rejects.toThrow('cancelar os lembretes'); });
  expect(session.user?.id).toBe('a');
  expect(reviveApi.logout).not.toHaveBeenCalled();
  expect(mockClear).not.toHaveBeenCalled();
  expect(setReminderAccount).toHaveBeenLastCalledWith('a');
});

it('preserves reminders until pending offline data is explicitly discarded', async () => {
  await mount();
  jest.mocked(countPendingMutations).mockResolvedValue(2);
  await act(async () => { expect(await session.signOut()).toEqual({ pending: 2 }); });
  expect(cancelAccountReminders).not.toHaveBeenCalled();
  expect(mockClear).not.toHaveBeenCalled();
});

it('cancels and removes preferences on successful account deletion', async () => {
  await mount();
  await act(async () => { await session.deleteAccount(); });
  expect(cancelAccountReminders).toHaveBeenCalled();
  expect(deleteReminderPreference).toHaveBeenCalledWith('a');
  expect(session.user).toBeNull();
});

it('stops deletion if cancellation failed and preserves account preferences', async () => {
  await mount();
  jest.mocked(cancelAccountReminders).mockRejectedValueOnce(new Error('native failure'));
  await act(async () => { await expect(session.deleteAccount()).rejects.toThrow('native failure'); });
  expect(reviveApi.deleteAccount).not.toHaveBeenCalled();
  expect(deleteReminderPreference).not.toHaveBeenCalled();
  expect(session.user?.id).toBe('a');
});

it('does not delete a new session that replaced the original during cancellation', async () => {
  await mount();
  jest.mocked(cancelAccountReminders).mockImplementationOnce(async () => { mockGeneration++; });
  await act(async () => { await session.deleteAccount(); });
  expect(reviveApi.deleteAccount).not.toHaveBeenCalled();
  expect(mockClear).not.toHaveBeenCalled();
});
