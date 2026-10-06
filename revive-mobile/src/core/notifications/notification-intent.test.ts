import { beforeEach, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { claimNotificationIntent, notificationIntent } from './notification-intent';
import { CHECKIN_PATH, REMINDER_KIND, REMINDER_PREFIX } from './reminder-contract';

jest.mock('expo-notifications', () => ({ DEFAULT_ACTION_IDENTIFIER: 'default' }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked' }));
const response = (date = 1000): Notifications.NotificationResponse => ({ actionIdentifier: 'default', notification: { date, request: { identifier: `${REMINDER_PREFIX}test`, content: { data: { kind: REMINDER_KIND, ownerId: 'a', path: CHECKIN_PATH } } } } } as never);

beforeEach(() => { jest.resetAllMocks(); jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null); });

it('accepts only the owned, literal check-in destination and a normal tap action', () => {
  expect(notificationIntent(response())).toMatchObject({ ownerId: 'a', path: CHECKIN_PATH, key: `${REMINDER_PREFIX}test:1000` });
  const unknown = response(); unknown.notification.request.content.data!.path = '/admin';
  expect(notificationIntent(unknown)).toBeNull();
  const injected = response(); injected.notification.request.content.data!.habitId = 'another-account';
  expect(notificationIntent(injected)).toBeNull();
  const unowned = response(); delete unowned.notification.request.content.data!.ownerId;
  expect(notificationIntent(unowned)).toBeNull();
  const legacy = response(); legacy.notification.request.identifier = 'old';
  expect(notificationIntent(legacy)).toBeNull();
  expect(notificationIntent({ ...response(), actionIdentifier: 'reply' })).toBeNull();
});

it('consumes the same response once across restart, while a new daily delivery is distinct', async () => {
  let persisted: string | null = null;
  jest.mocked(SecureStore.getItemAsync).mockImplementation(async () => persisted);
  jest.mocked(SecureStore.setItemAsync).mockImplementation(async (_key, value) => { persisted = value; });
  expect(await claimNotificationIntent(notificationIntent(response())!.key)).toBe(true);
  expect(await claimNotificationIntent(notificationIntent(response())!.key)).toBe(false);
  expect(await claimNotificationIntent(notificationIntent(response(2000))!.key)).toBe(true);
});

it('serializes simultaneous launch/listener claims without navigating twice', async () => {
  let persisted: string | null = null;
  jest.mocked(SecureStore.getItemAsync).mockImplementation(async () => persisted);
  jest.mocked(SecureStore.setItemAsync).mockImplementation(async (_key, value) => { persisted = value; });
  expect(await Promise.all([claimNotificationIntent('event'), claimNotificationIntent('event')])).toEqual([true, false]);
});

it('fails closed when consumed-event persistence is unavailable', async () => {
  jest.mocked(SecureStore.setItemAsync).mockRejectedValue(new Error('Cannot persist'));
  await expect(claimNotificationIntent('event')).rejects.toThrow('Cannot persist');
});
