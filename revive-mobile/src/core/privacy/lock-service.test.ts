import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { authenticateWithDevice, privacyLockPreferences } from './lock-service';

jest.mock('expo-local-authentication', () => ({
  __esModule: true,
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2 },
  getEnrolledLevelAsync: async () => 0,
  authenticateAsync: async () => ({ success: false, error: 'unknown' }),
}));

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only',
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

jest.mock('expo-screen-capture', () => ({
  __esModule: true,
  preventScreenCaptureAsync: async () => undefined,
  allowScreenCaptureAsync: async () => undefined,
  enableAppSwitcherProtectionAsync: async () => undefined,
  disableAppSwitcherProtectionAsync: async () => undefined,
}));

describe('privacy lock services', () => {
  const enrolledLevel = jest.spyOn(LocalAuthentication, 'getEnrolledLevelAsync');
  const authenticate = jest.spyOn(LocalAuthentication, 'authenticateAsync');
  const getItem = jest.spyOn(SecureStore, 'getItemAsync');
  const setItem = jest.spyOn(SecureStore, 'setItemAsync');
  const deleteItem = jest.spyOn(SecureStore, 'deleteItemAsync');

  beforeEach(() => { jest.clearAllMocks(); });

  it('keeps the preference separate for each account on this device', async () => {
    getItem.mockImplementation(async (key) => key.endsWith('account-a') ? 'enabled' : null);
    await expect(privacyLockPreferences.isEnabled('account-a')).resolves.toBe(true);
    await expect(privacyLockPreferences.isEnabled('account-b')).resolves.toBe(false);
    await privacyLockPreferences.enable('account-a');
    expect(setItem).toHaveBeenCalledWith(
      'revive.privacy_lock.v1.account-a', 'enabled',
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
    );
    await privacyLockPreferences.clear('account-a');
    expect(deleteItem).toHaveBeenCalledWith('revive.privacy_lock.v1.account-a');
  });

  it('allows the device credential fallback when no biometric is enrolled', async () => {
    enrolledLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.SECRET);
    authenticate.mockResolvedValue({ success: true });
    await expect(authenticateWithDevice('Desbloquear o Revive')).resolves.toEqual({ success: true });
    expect(authenticate).toHaveBeenCalledWith(expect.objectContaining({
      disableDeviceFallback: false,
      promptMessage: 'Desbloquear o Revive',
    }));
  });

  it('refuses to authenticate when neither biometrics nor a device credential exists', async () => {
    enrolledLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.NONE);
    await expect(authenticateWithDevice('Desbloquear o Revive')).resolves.toEqual({ success: false, error: 'not_enrolled' });
    expect(authenticate).not.toHaveBeenCalled();
  });
});
