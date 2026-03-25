import type { QueryOptions } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from './types';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { checkBudgetAlerts } from './checks/check-budget-alerts';
import { checkLowBalance } from './checks/check-low-balance';
import { checkUpcomingBills } from './checks/check-upcoming-bills';
import { checkWeeklyDigest } from './checks/check-weekly-digest';

export const NOTIFICATIONS_QUERY_KEY = ['notifications', 'canNotify'];

export const notificationsQuery = {
  queryKey: NOTIFICATIONS_QUERY_KEY,
  gcTime: 10000,
  queryFn: () => canNotify(),
} satisfies QueryOptions<boolean>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Create the Android notification channel. Call once at app startup. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Default',
    });
  }
}

/** Request OS notification permissions. Call only when the user enables notifications. */
export async function requestNotificationPermissions(): Promise<void> {
  await Notifications.requestPermissionsAsync();
}

/** Sets up Android channel + requests permissions. Used by the settings screen toggle. */
export async function setupNotifications(): Promise<void> {
  await ensureAndroidChannel();
  await requestNotificationPermissions();
}

export async function canNotify(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function send(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { body, title },
    trigger: null,
  });
}

/**
 * Run all notification checks. Called by ScheduledTransactionsProcessor on
 * app launch, foreground resume, and daily interval.
 */
export async function runAllNotificationChecks(
  db: SQLiteDatabase,
  settings: NotificationSettings,
): Promise<void> {
  if (!settings.global) return;
  if (!(await canNotify())) return;

  await checkUpcomingBills(db, settings);
  await checkBudgetAlerts(db, settings);
  await checkLowBalance(db, settings);
  await checkWeeklyDigest(db, settings);
}
