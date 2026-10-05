import { Platform } from 'react-native';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { cancelAccountReminders, restoreAccountReminder, setReminderAccount, updateAccountReminder } from './reminders';
import { REMINDER_KIND, REMINDER_PREFIX, CHECKIN_PATH } from './reminder-contract';

let mockAccount = 'a';
let mockGeneration = 1;
let mockUuid = 0;
jest.mock('@/core/auth/token-store', () => ({ tokenStore: { getGeneration: () => mockGeneration, isCurrent: (generation: number) => generation === mockGeneration, getUser: async () => ({ id: mockAccount }) } }));
jest.mock('expo-crypto', () => ({ randomUUID: () => `id-${++mockUuid}` }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(), WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked' }));
jest.mock('expo-notifications', () => ({ getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(), setNotificationChannelAsync: jest.fn(), getNotificationChannelAsync: jest.fn(), getAllScheduledNotificationsAsync: jest.fn(), scheduleNotificationAsync: jest.fn(), cancelScheduledNotificationAsync: jest.fn(), getPresentedNotificationsAsync: jest.fn(), dismissNotificationAsync: jest.fn(), AndroidImportance: { NONE: 0, DEFAULT: 3 }, IosAuthorizationStatus: { PROVISIONAL: 3 }, SchedulableTriggerInputTypes: { DAILY: 'daily' } }));

let store: Map<string, string>;
let scheduled: Notifications.NotificationRequest[];
const permission = (granted = true) => ({ granted, canAskAgain: true } as Notifications.NotificationPermissionsStatus);
const persisted = (account = 'a') => JSON.parse(store.get(`revive.reminder.v1.${account}`)!);
beforeEach(() => {
  jest.resetAllMocks();
  jest.replaceProperty(Platform, 'OS', 'android');
  store = new Map(); scheduled = []; mockAccount = 'a'; mockGeneration = 1; mockUuid = 0;
  setReminderAccount('a');
  jest.mocked(SecureStore.getItemAsync).mockImplementation(async key => store.get(key) ?? null);
  jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key, value) => { store.set(key, value); });
  jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async key => { store.delete(key); });
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission());
  jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue(permission());
  jest.mocked(Notifications.getNotificationChannelAsync).mockResolvedValue({ importance: 3 } as never);
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockImplementation(async () => [...scheduled]);
  jest.mocked(Notifications.getPresentedNotificationsAsync).mockResolvedValue([]);
  jest.mocked(Notifications.scheduleNotificationAsync).mockImplementation(async request => {
    scheduled.push(request as Notifications.NotificationRequest);
    return request.identifier!;
  });
  jest.mocked(Notifications.cancelScheduledNotificationAsync).mockImplementation(async id => { scheduled = scheduled.filter(item => item.identifier !== id); });
});
afterEach(() => { jest.restoreAllMocks(); });

it('defaults to 20:00 off, and saving a time while off never asks for permission', async () => {
  expect(await restoreAccountReminder('a')).toMatchObject({ preference: { hour: 20, minute: 0, enabled: false }, status: 'off' });
  await updateAccountReminder('a', { hour: 8, minute: 30, enabled: false });
  expect(await restoreAccountReminder('a')).toMatchObject({ preference: { hour: 8, minute: 30, enabled: false }, status: 'off' });
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('replaces 20:00 with exactly one 08:30 reminder and keeps it after restoring', async () => {
  await updateAccountReminder('a', { hour: 20, minute: 0, enabled: true }, true);
  const original = scheduled[0]!.identifier;
  const changed = await updateAccountReminder('a', { hour: 8, minute: 30, enabled: true });
  expect(changed.status).toBe('scheduled');
  expect(scheduled).toHaveLength(1);
  expect(scheduled[0]!.trigger).toMatchObject({ type: 'daily', hour: 8, minute: 30 });
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(original);
  expect(jest.mocked(Notifications.cancelScheduledNotificationAsync).mock.invocationCallOrder[0]!).toBeLessThan(jest.mocked(Notifications.scheduleNotificationAsync).mock.invocationCallOrder[1]!);
  await restoreAccountReminder('a');
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  expect(persisted()).toMatchObject({ hour: 8, minute: 30, enabled: true });
});

it('requests permission only on activation, after creating the Android channel', async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission(false));
  const result = await updateAccountReminder('a', { hour: 8, minute: 30, enabled: true }, true);
  expect(result.status).toBe('scheduled');
  expect(jest.mocked(Notifications.setNotificationChannelAsync).mock.invocationCallOrder[0]!).toBeLessThan(jest.mocked(Notifications.requestPermissionsAsync).mock.invocationCallOrder[0]!);
  expect(scheduled[0]!.content).toMatchObject({ title: 'Como você está hoje?', body: 'Reserve um momento para registrar seu check-in.', data: { kind: REMINDER_KIND, ownerId: 'a', path: CHECKIN_PATH } });
});

it('keeps the switch off when permission is denied, without silently asking again on restore', async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission(false));
  jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue(permission(false));
  expect(await updateAccountReminder('a', { hour: 8, minute: 30, enabled: true }, true)).toMatchObject({ status: 'blocked', preference: { enabled: false } });
  await restoreAccountReminder('a');
  expect(scheduled).toHaveLength(0);
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
});

it('detects revoked permission or a disabled channel and removes the native schedule', async () => {
  await updateAccountReminder('a', { hour: 20, minute: 0, enabled: true });
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission(false));
  expect((await restoreAccountReminder('a')).status).toBe('blocked');
  expect(scheduled).toHaveLength(0);
  expect(persisted().enabled).toBe(true);
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission());
  jest.mocked(Notifications.getNotificationChannelAsync).mockResolvedValue({ importance: 0 } as never);
  expect((await restoreAccountReminder('a')).status).toBe('blocked');
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});

it('rolls back a failed replacement to the previous clock time', async () => {
  await updateAccountReminder('a', { hour: 20, minute: 0, enabled: true });
  jest.mocked(Notifications.scheduleNotificationAsync).mockRejectedValueOnce(new Error('Native failure'));
  expect(await updateAccountReminder('a', { hour: 8, minute: 30, enabled: true })).toMatchObject({ status: 'scheduled', preference: { hour: 20, minute: 0 }, message: expect.stringContaining('anterior foi restaurado') });
  expect(scheduled).toHaveLength(1);
  expect(scheduled[0]!.trigger).toMatchObject({ hour: 20, minute: 0 });
});

it('does not create a duplicate when cancellation cannot be confirmed', async () => {
  await updateAccountReminder('a', { hour: 20, minute: 0, enabled: true });
  jest.mocked(Notifications.cancelScheduledNotificationAsync).mockRejectedValueOnce(new Error('Cannot cancel'));
  const result = await updateAccountReminder('a', { hour: 8, minute: 30, enabled: true });
  expect(result.message).toBeTruthy();
  expect(scheduled).toHaveLength(1);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

it('repairs an interrupted native schedule from the durable preference without duplicates', async () => {
  store.set('revive.reminder.v1.a', JSON.stringify({ version: 1, hour: 8, minute: 30, enabled: true, timezone: 'UTC', identifier: `${REMINDER_PREFIX}interrupted` }));
  expect((await restoreAccountReminder('a')).status).toBe('scheduled');
  await restoreAccountReminder('a');
  expect(scheduled).toHaveLength(1);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

it('cancels the native reminder and preserves malformed preference bytes for explicit recovery', async () => {
  await updateAccountReminder('a', { hour: 20, minute: 0, enabled: true });
  store.set('revive.reminder.v1.a', 'broken');
  await expect(restoreAccountReminder('a')).rejects.toThrow('preferência');
  expect(scheduled).toHaveLength(0);
  expect(store.get('revive.reminder.v1.a')).toBe('broken');
  expect((await updateAccountReminder('a', { hour: 8, minute: 30, enabled: false })).status).toBe('off');
  expect(persisted()).toMatchObject({ hour: 8, minute: 30, enabled: false });
});

it('reschedules after the device timezone changes even when the clock preference is unchanged', async () => {
  await updateAccountReminder('a', { hour: 8, minute: 30, enabled: true });
  const original = scheduled[0]!.identifier;
  jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({ resolvedOptions: () => ({ timeZone: 'Europe/Lisbon' }) } as never);
  await restoreAccountReminder('a');
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(original);
  expect(scheduled).toHaveLength(1);
  expect(persisted().timezone).toBe('Europe/Lisbon');
});

it('preserves account A preferences but schedules only account B after switching', async () => {
  await updateAccountReminder('a', { hour: 8, minute: 30, enabled: true });
  setReminderAccount(null); await cancelAccountReminders();
  mockAccount = 'b'; mockGeneration++; setReminderAccount('b');
  await restoreAccountReminder('b');
  expect(scheduled).toHaveLength(0);
  await updateAccountReminder('b', { hour: 12, minute: 15, enabled: true });
  expect(scheduled).toHaveLength(1);
  expect(scheduled[0]!.content.data?.ownerId).toBe('b');
  expect(persisted('a')).toMatchObject({ hour: 8, minute: 30, enabled: true });
});

it('removes a late native result after logout starts and never restores the former schedule', async () => {
  jest.mocked(Notifications.scheduleNotificationAsync).mockImplementationOnce(async request => {
    setReminderAccount(null); mockGeneration++;
    scheduled.push(request as Notifications.NotificationRequest);
    return request.identifier!;
  });
  await expect(updateAccountReminder('a', { hour: 8, minute: 30, enabled: true })).rejects.toThrow('A sessão mudou');
  expect(scheduled).toHaveLength(0);
});

it('purges the unowned legacy reminder without importing it into a different account', async () => {
  store.set('revive.daily_notification_id', 'legacy');
  scheduled.push({ identifier: 'legacy', content: { title: 'Como você está hoje?', body: 'Reserve um momento para registrar seu check-in.', data: { path: '/(app)/(tabs)' } }, trigger: { type: 'daily', hour: 20, minute: 0 } } as never);
  await restoreAccountReminder('a');
  expect(scheduled).toHaveLength(0);
  expect(store.has('revive.daily_notification_id')).toBe(false);
  expect(store.has('revive.reminder.v1.a')).toBe(false);
});

it('serializes rapid edits and rejects invalid times before touching the native scheduler', async () => {
  await Promise.all([updateAccountReminder('a', { hour: 20, minute: 0, enabled: true }), updateAccountReminder('a', { hour: 8, minute: 30, enabled: true })]);
  expect(scheduled).toHaveLength(1);
  expect(scheduled[0]!.trigger).toMatchObject({ hour: 8, minute: 30 });
  await expect(updateAccountReminder('a', { hour: 24, minute: 60, enabled: true })).rejects.toThrow('hora de 00 a 23');
  expect(scheduled).toHaveLength(1);
});
