import * as SecureStore from 'expo-secure-store';

const key = (userId: string) => `revive.checkin.habit.v1.${userId}`;

/** Only the last chosen habit ID; never store reflection text here. */
export const checkinSelection = {
  get: (userId: string) => SecureStore.getItemAsync(key(userId)),
  set: (userId: string, habitId: string) => SecureStore.setItemAsync(key(userId), habitId, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  clear: (userId: string) => SecureStore.deleteItemAsync(key(userId)),
};
