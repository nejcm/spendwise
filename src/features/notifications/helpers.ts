import type { NotificationSettings } from './types';

export type NotificationType = 'upcomingBills' | 'budgetAlerts' | 'lowBalance' | 'weeklyDigest' | 'recommendations';

const NOTIFICATION_TYPES: NotificationType[] = ['upcomingBills', 'budgetAlerts', 'lowBalance', 'weeklyDigest', 'recommendations'];

const OPT_IN_TYPES = new Set<NotificationType>(['lowBalance', 'weeklyDigest']);

// Mirrors the checks: opt-in types fire only when `true`, the rest unless `false`.
function isTypeEnabled(settings: NotificationSettings, type: NotificationType): boolean {
  return OPT_IN_TYPES.has(type) ? settings[type] === true : settings[type] !== false;
}

export function isNotificationOn(settings: NotificationSettings, type: NotificationType): boolean {
  return !!settings.global && isTypeEnabled(settings, type);
}

/** The first toggle-on also opts in (`global`) and turns the other types off, so only what the user picked fires. */
export function toggleNotification(settings: NotificationSettings, type: NotificationType, on: boolean): Partial<NotificationSettings> {
  if (!on || settings.global) return { [type]: on };
  return { ...Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t, t === type])), global: true };
}

export function countNotificationsOn(settings: NotificationSettings, recommendationsEnabled: boolean): number {
  return NOTIFICATION_TYPES.filter((type) => (type !== 'recommendations' || recommendationsEnabled) && isNotificationOn(settings, type)).length;
}
