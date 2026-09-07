import * as SecureStore from 'expo-secure-store';
import type { User } from '@/domain/types';

const REFRESH_TOKEN_KEY = 'revive.refresh_token';
const USER_KEY = 'revive.session_user';

let accessToken: string | null = null;

export const tokenStore = {
  getUser: async (): Promise<User | null> => {
    const stored = await SecureStore.getItemAsync(USER_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored) as User; } catch { return null; }
  },
  setUser: (user: User) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  getAccessToken: () => accessToken,
  setAccessToken: (token: string | null) => {
    accessToken = token;
  },
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) =>
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  clear: async () => {
    accessToken = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
