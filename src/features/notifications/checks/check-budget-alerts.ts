import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from '../types';
import { format } from 'date-fns';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { currentMonthRange, getBudgetSpendForMonth } from '../queries';
import { send } from '../send';

function budgetAlertKey(categoryId: string, yearMonth: string, threshold: number) {
  return `notif.budget.${categoryId}.${yearMonth}.${threshold}`;
}

export async function checkBudgetAlerts(
  db: SQLiteDatabase,
  settings: NotificationSettings,
): Promise<void> {
  if (settings.budgetAlerts === false) return;

  const yearMonth = format(new Date(), 'yyyy-MM');
  const [monthStart, monthEnd] = currentMonthRange();
  const categories = await getBudgetSpendForMonth(db, monthStart, monthEnd);

  for (const cat of categories) {
    const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
    const warningThreshold = cat.budget_alert_threshold ?? 80;

    if (pct >= warningThreshold) {
      const keyWarn = budgetAlertKey(cat.id, yearMonth, warningThreshold);
      if (storage.getString(keyWarn) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          translate('notifications.budget_approaching', { name: cat.name, percent: Math.round(pct) } as never),
        );
        storage.set(keyWarn, '1');
      }
    }

    if (pct >= 100) {
      const key100 = budgetAlertKey(cat.id, yearMonth, 100);
      if (storage.getString(key100) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          translate('notifications.budget_exceeded', { name: cat.name } as never),
        );
        storage.set(key100, '1');
      }
    }
  }
}
