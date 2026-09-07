import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const notificationIdKey = 'revive.daily_notification_id';

export const configureNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('lembretes', {
    name: 'Lembretes de autocuidado',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
    lightColor: '#7CF6C4',
  });
};

export const scheduleDailyCheckIn = async (hour: number, minute: number) => {
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Permissão de notificações não concedida.');
  await configureNotificationChannel();
  await cancelDailyCheckIn();
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Como você está hoje?',
      body: 'Reserve um momento para registrar seu check-in.',
      data: { path: '/(app)/(tabs)' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'lembretes',
    },
  });
  await SecureStore.setItemAsync(notificationIdKey, identifier);
  return identifier;
};

export const cancelDailyCheckIn = async () => {
  const identifier = await SecureStore.getItemAsync(notificationIdKey);
  if (!identifier) return;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
  await SecureStore.deleteItemAsync(notificationIdKey);
};

export const isDailyCheckInScheduled = async () => {
  const identifier = await SecureStore.getItemAsync(notificationIdKey);
  if (!identifier) return false;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((notification) => notification.identifier === identifier);
};
