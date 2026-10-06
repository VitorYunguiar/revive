export const REMINDER_KIND = 'revive.checkin.v2';
export const REMINDER_PREFIX = 'revive.checkin.v2.';
export const CHECKIN_PATH = '/(app)/check-in';
export const formatReminderTime = (hour: number, minute: number) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
export function validReminderTime(hour: number, minute: number) {
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 && Number.isInteger(minute) && minute >= 0 && minute <= 59;
}
