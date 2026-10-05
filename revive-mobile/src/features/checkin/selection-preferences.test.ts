import { beforeEach, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { checkinSelection } from './selection-preferences';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(), WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked' }));
beforeEach(() => { jest.clearAllMocks(); });

it('uses separate, versioned keys for each account, storing only the habit ID', async () => {
  await checkinSelection.set('a', 'habit-a');
  await checkinSelection.set('b', 'habit-b');
  await checkinSelection.get('a');
  await checkinSelection.clear('b');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('revive.checkin.habit.v1.a', 'habit-a', { keychainAccessible: 'unlocked' });
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('revive.checkin.habit.v1.b', 'habit-b', { keychainAccessible: 'unlocked' });
  expect(SecureStore.getItemAsync).toHaveBeenCalledWith('revive.checkin.habit.v1.a');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('revive.checkin.habit.v1.b');
});
