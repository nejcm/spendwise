import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from '../types';
import { format } from 'date-fns';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { send } from '../notifications';
import { currentMonthRange, getBudgetSpendForMonth } from '../queries';

function budgetAlertKey(categoryId: string, yearMonth: string, threshold: 80 | 100) {
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

    if (pct >= 80) {
      const key80 = budgetAlertKey(cat.id, yearMonth, 80);
      if (storage.getString(key80) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          translate('notifications.budget_approaching', { name: cat.name, percent: Math.round(pct) } as never),
        );
        storage.set(key80, '1');
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
