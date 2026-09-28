import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PREFERENCE_PREFIX = 'revive.privacy_lock.v1.';
const SCREEN_CAPTURE_KEY = 'revive-privacy-lock';

const preferenceKey = (userId: string) => `${PREFERENCE_PREFIX}${userId}`;

export const privacyLockPreferences = {
  isEnabled: async (userId: string) => (await SecureStore.getItemAsync(preferenceKey(userId))) === 'enabled',
  enable: (userId: string) => SecureStore.setItemAsync(preferenceKey(userId), 'enabled', {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  clear: (userId: string) => SecureStore.deleteItemAsync(preferenceKey(userId)),
};

export async function authenticateWithDevice(promptMessage: string) {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level === LocalAuthentication.SecurityLevel.NONE) {
    return { success: false as const, error: 'not_enrolled' as const };
  }
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar código',
    biometricsSecurityLevel: 'weak',
    disableDeviceFallback: false,
  });
}

export const privacyScreenProtection = {
  enable: async () => {
    if (Platform.OS === 'android') {
      await ScreenCapture.preventScreenCaptureAsync(SCREEN_CAPTURE_KEY);
    } else if (Platform.OS === 'ios') {
      await ScreenCapture.enableAppSwitcherProtectionAsync(1);
    }
  },
  disable: async () => {
    if (Platform.OS === 'android') {
      await ScreenCapture.allowScreenCaptureAsync(SCREEN_CAPTURE_KEY);
    } else if (Platform.OS === 'ios') {
      await ScreenCapture.disableAppSwitcherProtectionAsync();
    }
  },
};

export function authenticationErrorMessage(error?: string) {
  switch (error) {
    case 'not_enrolled':
    case 'passcode_not_set':
      return 'Configure uma biometria ou um código de desbloqueio nas configurações do aparelho.';
    case 'not_available':
      return 'A autenticação do sistema está indisponível. Verifique a biometria ou o código do aparelho.';
    case 'lockout':
      return 'A autenticação está temporariamente bloqueada. Aguarde o aparelho liberá-la e tente novamente.';
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'Autenticação cancelada. O conteúdo continua protegido.';
    default:
      return 'Não foi possível autenticar com o aparelho. O conteúdo continua protegido.';
  }
}
