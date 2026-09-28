import React from 'react';
import { AppState, Switch, Text, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrivacyLockProvider, usePrivacyLock } from './privacy-lock-provider';

let mockUser: { id: string } | null = { id: 'account-a' };
let mockIsRestoring = false;
type MockAuthResult = { success: true } | { success: false; error: string };
let mockAuthenticate = jest.fn<(prompt: string) => Promise<MockAuthResult>>();
let mockIsEnabled = jest.fn<(userId: string) => Promise<boolean>>();
let mockEnable = jest.fn<(userId: string) => Promise<void>>();
let mockClear = jest.fn<(userId: string) => Promise<void>>();
let mockProtect = jest.fn<() => Promise<void>>();
let mockUnprotect = jest.fn<() => Promise<void>>();

jest.mock('@/features/auth/session-context', () => ({
  useSession: () => ({ user: mockUser, isRestoring: mockIsRestoring }),
}));

jest.mock('lucide-react-native', () => ({ Fingerprint: () => null }));

jest.mock('@/core/privacy/lock-service', () => ({
  authenticateWithDevice: (prompt: string) => mockAuthenticate(prompt),
  authenticationErrorMessage: (error?: string) => error === 'user_cancel' ? 'Autenticação cancelada. O conteúdo continua protegido.' : 'Autenticação indisponível.',
  privacyLockPreferences: {
    isEnabled: (userId: string) => mockIsEnabled(userId),
    enable: (userId: string) => mockEnable(userId),
    clear: (userId: string) => mockClear(userId),
  },
  privacyScreenProtection: {
    enable: () => mockProtect(),
    disable: () => mockUnprotect(),
  },
}));

function TestContent() {
  const lock = usePrivacyLock();
  return (
    <View>
      <Text>Conteúdo privado da conta</Text>
      <Switch testID="privacy-switch" value={lock.isEnabled} disabled={lock.isLoading} onValueChange={(value) => void lock.setEnabled(value)} />
    </View>
  );
}

async function renderPrivacyTree() {
  let rendered: ReturnType<typeof render> | undefined;
  await act(async () => {
    rendered = render(<PrivacyLockProvider><TestContent /></PrivacyLockProvider>);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
  if (!rendered) throw new Error('A árvore protegida não foi renderizada.');
  return rendered as ReturnType<typeof render>;
}

describe('PrivacyLockProvider', () => {
  let appStateListener: ((state: string) => void) | null;

  beforeEach(() => {
    mockUser = { id: 'account-a' };
    mockIsRestoring = false;
    mockAuthenticate = jest.fn<(prompt: string) => Promise<MockAuthResult>>().mockResolvedValue({ success: true });
    mockIsEnabled = jest.fn<(userId: string) => Promise<boolean>>().mockResolvedValue(false);
    mockEnable = jest.fn<(userId: string) => Promise<void>>().mockResolvedValue(undefined);
    mockClear = jest.fn<(userId: string) => Promise<void>>().mockResolvedValue(undefined);
    mockProtect = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    mockUnprotect = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    appStateListener = null;
    void jest.spyOn(AppState, 'addEventListener').mockImplementation(((_event, listener) => {
      appStateListener = listener as (state: string) => void;
      return { remove: jest.fn() } as ReturnType<typeof AppState.addEventListener>;
    }) as typeof AppState.addEventListener);
  });

  afterEach(() => { jest.restoreAllMocks(); });

  it('never renders app content while the account session or local preference is unresolved', async () => {
    mockIsRestoring = true;
    mockUser = null;
    const rendered = await renderPrivacyTree();
    expect(rendered.queryByTestId('protected-layer')).toBeNull();
    expect(rendered.getByText('Preparando área protegida')).toBeTruthy();
  });

  it('keeps content hidden after a canceled launch prompt and reveals it only after a successful retry', async () => {
    mockIsEnabled.mockResolvedValue(true);
    mockAuthenticate.mockResolvedValueOnce({ success: false, error: 'user_cancel' }).mockResolvedValueOnce({ success: true });
    const rendered = await renderPrivacyTree();

    await waitFor(() => expect(rendered.getByText('Autenticação cancelada. O conteúdo continua protegido.')).toBeTruthy());
    expect(rendered.getByTestId('protected-layer', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
    expect(rendered.getByTestId('protected-layer', { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
    await act(async () => {
      fireEvent.press(rendered.getByRole('button', { name: 'Desbloquear o Revive' }));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() => expect(rendered.getByTestId('protected-layer', { includeHiddenElements: true }).props.pointerEvents).toBe('auto'));
  });

  it('locks before the app returns from background and requires a new device authentication', async () => {
    mockIsEnabled.mockResolvedValue(true);
    const rendered = await renderPrivacyTree();
    await waitFor(() => expect(rendered.getByText('Conteúdo privado da conta')).toBeTruthy());
    expect(appStateListener).not.toBeNull();

    await act(async () => { appStateListener?.('background'); });
    await waitFor(() => expect(rendered.getByTestId('protected-layer', { includeHiddenElements: true }).props.pointerEvents).toBe('none'));
    await act(async () => { appStateListener?.('active'); });
    await waitFor(() => expect(rendered.getByTestId('protected-layer', { includeHiddenElements: true }).props.pointerEvents).toBe('auto'));
    expect(mockAuthenticate).toHaveBeenCalledTimes(2);
  });

  it('does not enable the preference after canceled authentication', async () => {
    mockAuthenticate.mockResolvedValue({ success: false, error: 'user_cancel' });
    const rendered = await renderPrivacyTree();
    await waitFor(() => expect(rendered.getByText('Conteúdo privado da conta')).toBeTruthy());
    await act(async () => {
      fireEvent(rendered.getByTestId('privacy-switch'), 'valueChange', true);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => expect(mockAuthenticate).toHaveBeenCalledWith('Ativar bloqueio do Revive'));
    expect(mockEnable).not.toHaveBeenCalled();
    expect(rendered.getByTestId('privacy-switch').props.value).toBe(false);
  });
});
