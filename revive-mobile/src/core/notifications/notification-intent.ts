import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { CHECKIN_PATH, REMINDER_KIND, REMINDER_PREFIX } from './reminder-contract';
import { isAllowedNotificationPath } from './notification-path';

export type NotificationIntent = { key: string; identifier: string; ownerId: string; path: typeof CHECKIN_PATH };
const consumedKey = 'revive.notifications.consumed.v1';
let consumption = Promise.resolve();

export function notificationIntent(response: Notifications.NotificationResponse): NotificationIntent | null {
  const notification = response.notification;
  const request = notification.request;
  const data = request.content.data;
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER || !request.identifier.startsWith(REMINDER_PREFIX)
    || request.identifier.length > 100 || !Number.isFinite(notification.date) || data?.kind !== REMINDER_KIND
    || typeof data.ownerId !== 'string' || !data.ownerId || data.ownerId.length > 100
    || data.path !== CHECKIN_PATH || !isAllowedNotificationPath(data.path)
    || Object.keys(data).some(key => !['kind', 'ownerId', 'path'].includes(key))) return null;
  return { key: `${request.identifier}:${notification.date}`, identifier: request.identifier, ownerId: data.ownerId, path: CHECKIN_PATH };
}

/** Persist before navigation so launch response and listener cannot both open it. */
export function claimNotificationIntent(key: string) {
  const next = consumption.then(async () => {
    const raw = await SecureStore.getItemAsync(consumedKey);
    let consumed: string[] = [];
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')) throw new Error('Histórico de notificações inválido.');
      consumed = parsed;
    }
    if (consumed.includes(key)) return false;
    await SecureStore.setItemAsync(consumedKey, JSON.stringify([...consumed.slice(-15), key]), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    return true;
  });
  consumption = next.then(() => undefined, () => undefined);
  return next;
}
