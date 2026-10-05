import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { tokenStore } from '@/core/auth/token-store';
import { REMINDER_KIND, REMINDER_PREFIX, CHECKIN_PATH, validReminderTime } from './reminder-contract';

const legacyKey = 'revive.daily_notification_id';
const preferenceKey = (userId: string) => `revive.reminder.v1.${userId}`;
let currentAccount: string | null = null;
let operations = Promise.resolve();

export type ReminderPreference = { version: 1; hour: number; minute: number; enabled: boolean; timezone?: string; identifier?: string };
export type ReminderState = { preference: ReminderPreference; status: 'off' | 'scheduled' | 'blocked' | 'error'; message?: string };
export const defaultReminderPreference = (): ReminderPreference => ({ version: 1, hour: 20, minute: 0, enabled: false });
export const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const serialize = <T,>(operation: () => Promise<T>) => {
  const next = operations.then(operation, operation);
  operations = next.then(() => undefined, () => undefined);
  return next;
};

/** Session boundaries close this gate synchronously, before awaiting native I/O. */
export const setReminderAccount = (userId: string | null) => { currentAccount = userId; };
const assertAccount = async (userId: string, generation: number) => {
  if (currentAccount !== userId || !tokenStore.isCurrent(generation) || (await tokenStore.getUser())?.id !== userId) {
    throw new Error('A sessão mudou durante a configuração do lembrete.');
  }
  if (currentAccount !== userId || !tokenStore.isCurrent(generation)) throw new Error('A sessão mudou durante a configuração do lembrete.');
};

const loadPreference = async (userId: string): Promise<ReminderPreference> => {
  const value = await SecureStore.getItemAsync(preferenceKey(userId));
  if (!value) return defaultReminderPreference();
  try {
    const parsed = JSON.parse(value);
    if (parsed.version === 1 && validReminderTime(parsed.hour, parsed.minute) && typeof parsed.enabled === 'boolean'
      && (parsed.timezone === undefined || typeof parsed.timezone === 'string')
      && (parsed.identifier === undefined || (typeof parsed.identifier === 'string' && parsed.identifier.startsWith(REMINDER_PREFIX)))) return parsed;
  } catch { /* Preserve malformed source bytes until an explicit preference change. */ }
  throw new Error('Não foi possível ler a preferência de lembrete. Salve novamente o horário para recuperá-la.');
};
const savePreference = (userId: string, preference: ReminderPreference) => SecureStore.setItemAsync(preferenceKey(userId), JSON.stringify(preference), {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

export const configureNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('lembretes', {
    name: 'Lembretes de autocuidado', importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200], lightColor: '#7CF6C4',
  });
};

const permissionAllowed = (permission: Notifications.NotificationPermissionsStatus) => permission.granted
  || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

const hasPermission = async (request: boolean) => {
  if (request) await configureNotificationChannel();
  let permission = await Notifications.getPermissionsAsync();
  if (!permissionAllowed(permission) && request && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
  if (!permissionAllowed(permission)) return false;
  await configureNotificationChannel();
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync('lembretes');
    if (!channel || channel.importance === Notifications.AndroidImportance.NONE) return false;
  }
  return true;
};

function managed(request: Notifications.NotificationRequest, legacyId: string | null) {
  return request.identifier.startsWith(REMINDER_PREFIX) || request.identifier === legacyId
    || request.content.data?.kind === REMINDER_KIND
    || (request.content.title === 'Como você está hoje?' && request.content.body === 'Reserve um momento para registrar seu check-in.' && request.content.data?.path === '/(app)/(tabs)');
}

async function clearManaged() {
  if (Platform.OS === 'web') return;
  const legacyId = await SecureStore.getItemAsync(legacyKey);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled.filter(item => managed(item, legacyId))) await Notifications.cancelScheduledNotificationAsync(request.identifier);
  if ((await Notifications.getAllScheduledNotificationsAsync()).some(item => managed(item, legacyId))) throw new Error('O sistema não confirmou o cancelamento do lembrete anterior.');
  for (const notification of await Notifications.getPresentedNotificationsAsync()) {
    if (managed(notification.request, legacyId)) await Notifications.dismissNotificationAsync(notification.request.identifier);
  }
  if (legacyId) await SecureStore.deleteItemAsync(legacyKey);
}

/** Cancel all app-owned reminders while preserving per-account choices. */
export const cancelAccountReminders = () => serialize(clearManaged);
export const clearRemindersWithoutAccount = () => serialize(async () => { if (currentAccount === null) await clearManaged(); });
export const deleteReminderPreference = (userId: string) => serialize(() => SecureStore.deleteItemAsync(preferenceKey(userId)));

function matches(request: Notifications.NotificationRequest, userId: string, preference: ReminderPreference) {
  const data = request.content.data;
  if (request.identifier !== preference.identifier || data?.kind !== REMINDER_KIND || data.ownerId !== userId || data.path !== CHECKIN_PATH) return false;
  const trigger = request.trigger;
  if (!trigger || typeof trigger !== 'object' || !('type' in trigger)) return false;
  if (trigger.type === 'daily') return 'hour' in trigger && trigger.hour === preference.hour && 'minute' in trigger && trigger.minute === preference.minute;
  if (trigger.type !== 'calendar' || !('repeats' in trigger) || !trigger.repeats || !('dateComponents' in trigger)) return false;
  const components = trigger.dateComponents;
  return Boolean(components && typeof components === 'object' && 'hour' in components && components.hour === preference.hour && 'minute' in components && components.minute === preference.minute);
}

async function ensureScheduled(userId: string, preference: ReminderPreference, generation: number): Promise<ReminderState> {
  await assertAccount(userId, generation);
  const timezone = deviceTimezone();
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const legacyId = await SecureStore.getItemAsync(legacyKey);
  const reminders = all.filter(item => managed(item, legacyId));
  if (preference.timezone === timezone && reminders.length === 1 && matches(reminders[0]!, userId, preference)) return { preference, status: 'scheduled' };
  const next: ReminderPreference = {
    ...preference, timezone,
    identifier: preference.timezone === timezone && preference.identifier ? preference.identifier : `${REMINDER_PREFIX}${Crypto.randomUUID()}`,
  };
  // Persist intent first. A crash at any later step is repaired on session restore.
  await savePreference(userId, next);
  await clearManaged();
  await assertAccount(userId, generation);
  const trigger = { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: next.hour, minute: next.minute, channelId: 'lembretes' } as const;
  let identifier: string | undefined;
  try {
    identifier = await Notifications.scheduleNotificationAsync({
      identifier: next.identifier,
      content: { title: 'Como você está hoje?', body: 'Reserve um momento para registrar seu check-in.', data: { kind: REMINDER_KIND, ownerId: userId, path: CHECKIN_PATH } }, trigger,
    });
    await assertAccount(userId, generation);
    const actual = (await Notifications.getAllScheduledNotificationsAsync()).filter(item => managed(item, null));
    if (actual.length !== 1 || !matches(actual[0]!, userId, next)) throw new Error('O sistema não confirmou o novo agendamento.');
    return { preference: next, status: 'scheduled' };
  } catch (error) {
    if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier);
    throw error;
  }
}

const blockedMessage = 'Notificações não autorizadas ou canal desativado. Revise a permissão nas configurações do aparelho.';

export const restoreAccountReminder = (userId: string) => {
  const generation = tokenStore.getGeneration();
  return serialize(async (): Promise<ReminderState> => {
    await assertAccount(userId, generation);
    let preference: ReminderPreference;
    try { preference = await loadPreference(userId); }
    catch (error) { await clearManaged(); throw error; }
    if (Platform.OS === 'web') return { preference, status: 'blocked', message: 'Lembretes locais estão disponíveis no aplicativo Android/iOS.' };
    if (!preference.enabled) { await clearManaged(); return { preference, status: 'off' }; }
    if (!await hasPermission(false)) { await clearManaged(); return { preference, status: 'blocked', message: blockedMessage }; }
    return ensureScheduled(userId, preference, generation);
  });
};

export const updateAccountReminder = (userId: string, settings: { hour: number; minute: number; enabled: boolean }, requestPermission = false) => {
  const generation = tokenStore.getGeneration();
  return serialize(async (): Promise<ReminderState> => {
    if (!validReminderTime(settings.hour, settings.minute)) throw new Error('Informe hora de 00 a 23 e minuto de 00 a 59.');
    await assertAccount(userId, generation);
    let previous: ReminderPreference;
    try { previous = await loadPreference(userId); } catch { previous = defaultReminderPreference(); }
    const next: ReminderPreference = { version: 1, ...settings };
    if (Platform.OS === 'web') return { preference: previous, status: 'blocked', message: 'Lembretes locais estão disponíveis no aplicativo Android/iOS.' };
    try {
      if (settings.enabled && !await hasPermission(requestPermission)) {
        await assertAccount(userId, generation);
        await savePreference(userId, { ...next, enabled: false });
        await clearManaged();
        return { preference: { ...next, enabled: false }, status: 'blocked', message: blockedMessage };
      }
      await assertAccount(userId, generation);
      if (!settings.enabled) {
        await savePreference(userId, next); await clearManaged();
        return { preference: next, status: 'off' };
      }
      return await ensureScheduled(userId, next, generation);
    } catch {
      await assertAccount(userId, generation);
      try {
        await savePreference(userId, previous);
        if (previous.enabled && await hasPermission(false)) {
          const restored = await ensureScheduled(userId, previous, generation);
          return { ...restored, message: 'Não foi possível alterar o lembrete. O horário anterior foi restaurado.' };
        }
        await clearManaged();
        return { preference: previous, status: previous.enabled ? 'blocked' : 'off', message: 'Não foi possível alterar o lembrete. Tente novamente.' };
      } catch {
        return { preference: previous, status: 'error', message: 'Não foi possível confirmar o agendamento ou recuperar o anterior. Tente recuperar o lembrete.' };
      }
    }
  });
};
