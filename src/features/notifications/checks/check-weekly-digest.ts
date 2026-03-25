import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from '../types';
import { addDays, getISOWeek, startOfISOWeek } from 'date-fns';
import { dateToUnix } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { send } from '../notifications';
import { getWeeklySpendSummary } from '../queries';

function digestKey(yearWeek: string) {
  return `notif.digest.${yearWeek}`;
}

export async function checkWeeklyDigest(
  db: SQLiteDatabase,
  settings: NotificationSettings,
): Promise<void> {
  if (settings.weeklyDigest !== true) return;

  const now = new Date();
  // Only fire on Sundays (getDay() === 0)
  if (now.getDay() !== 0) return;

  const year = now.getFullYear();
  const week = getISOWeek(now);
  const yearWeek = `${year}-W${String(week).padStart(2, '0')}`;
  const key = digestKey(yearWeek);
  if (storage.getString(key) === '1') return;

  const weekStart = startOfISOWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const summary = await getWeeklySpendSummary(db, dateToUnix(weekStart), dateToUnix(weekEnd));

  const formatAmount = (cents: number) => (cents / 100).toFixed(2);

  await send(
    translate('notifications.weekly_digest_title'),
    translate('notifications.weekly_digest_body', {
      expense: formatAmount(summary.expense),
      income: formatAmount(summary.income),
    } as never),
  );
  storage.set(key, '1');
}
