import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from '../types';
import { addDays } from 'date-fns';
import { todayISO, todayUnix } from '@/features/formatting/helpers';
import { unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { send } from '../notifications';

type RuleRow = {
  id: string;
  next_due_date: number;
  category_name: string | null;
};

function ruleAlertKey(ruleId: string, dueDate: string) {
  return `notif.rule.${ruleId}.${dueDate}`;
}

export async function checkUpcomingBills(
  db: SQLiteDatabase,
  settings: NotificationSettings,
): Promise<void> {
  if (settings.upcomingBills === false) return;

  const windowDays = settings.upcomingBillsDays ?? 7;
  const todayStart = todayUnix();
  const windowEndUnix = Math.floor(
    addDays(new Date(todayStart * 1000), windowDays).getTime() / 1000,
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
    if (storage.getString(key) !== '1') {
      const name = rule.category_name ?? translate('notifications.bill_default_name');
      const isToday = dueStr === todayStr;
      const body = isToday
        ? translate('notifications.bill_due_today', { name } as never)
        : translate('notifications.bill_due_on', { name, date: dueStr } as never);
      await send(translate('notifications.upcoming_bills'), body);
      storage.set(key, '1');
    }
  }
}
