import type { QueryOptions } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';
import { addDays } from 'date-fns';
import * as Notifications from 'expo-notifications';

import { Platform } from 'react-native';
import { todayISO, todayUnix } from '@/features/formatting/helpers';
import { unixToISODate } from '@/lib/date/helpers';
import { storage } from '@/lib/storage';

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

// Keys to track which notifications have already been sent
function ruleAlertKey(ruleId: string, dueDate: string) {
  return `notif.rule.${ruleId}.${dueDate}`;
}

function wasNotified(key: string): boolean {
  return storage.getString(key) === '1';
}

function markNotified(key: string): void {
  storage.set(key, '1');
}

export async function setupNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Default',
    });
  }
  await Notifications.requestPermissionsAsync();
}

export async function canNotify(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function send(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { body, title },
    trigger: null,
  });
}

type RuleRow = {
  id: string;
  next_due_date: number;
  category_name: string | null;
};

export async function checkUpcomingBills(db: SQLiteDatabase): Promise<void> {
  if (!(await canNotify())) {
    return;
  }

  const todayStart = todayUnix();
  const windowEndUnix = Math.floor(
    addDays(new Date(todayStart * 1000), 3).getTime() / 1000,
  );
  const todayStr = todayISO();

  const rules = await db.getAllAsync<RuleRow>(
    `SELECT r.id, r.next_due_date, c.name AS category_name
     FROM recurring_rules r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.is_active = 1
       AND r.type = 'expense'
       AND r.next_due_date >= ?
       AND r.next_due_date <= ?`,
    [todayStart, windowEndUnix],
  );

  for (const rule of rules) {
    const dueStr = unixToISODate(rule.next_due_date);
    const key = ruleAlertKey(rule.id, dueStr);
    if (!wasNotified(key)) {
      const name = rule.category_name ?? 'Bill';
      const isToday = dueStr === todayStr;
      const body = isToday ? `${name} is due today.` : `${name} is due on ${dueStr}.`;
      await send('Upcoming Bill', body);
      markNotified(key);
    }
  }
}
