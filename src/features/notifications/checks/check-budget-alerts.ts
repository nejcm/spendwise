import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from '../types';
import { format } from 'date-fns';
import { getGlobalBudget, getGlobalBudgetSpend } from '@/features/stats/global-budget-queries';
import { currentMonthRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { getBudgetSpendForMonth } from '../queries';
import { send } from '../send';

function budgetAlertKey(categoryId: string, yearMonth: string, threshold: 80 | 100) {
  return `notif.budget.${categoryId}.${yearMonth}.${threshold}`;
}

function globalBudgetAlertKey(yearMonth: string, threshold: 80 | 100) {
  return `notif.budget.global.${yearMonth}.${threshold}`;
}

export async function checkBudgetAlerts(
  db: SQLiteDatabase,
  settings: NotificationSettings,
): Promise<void> {
  if (settings.budgetAlerts === false) return;

  const yearMonth = format(new Date(), 'yyyy-MM');
  const [monthStart, monthEnd] = currentMonthRange();

  const [categories, globalBudget] = await Promise.all([
    getBudgetSpendForMonth(db, monthStart, monthEnd),
    getGlobalBudget(db),
  ]);

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

  if (globalBudget != null && globalBudget > 0) {
    const spent = await getGlobalBudgetSpend(db, monthStart, monthEnd);
    const pct = (spent / globalBudget) * 100;

    if (pct >= 80) {
      const key80 = globalBudgetAlertKey(yearMonth, 80);
      if (storage.getString(key80) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          translate('notifications.global_budget_approaching', { percent: Math.round(pct) } as never),
        );
        storage.set(key80, '1');
      }
    }

    if (pct >= 100) {
      const key100 = globalBudgetAlertKey(yearMonth, 100);
      if (storage.getString(key100) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          translate('notifications.global_budget_exceeded'),
        );
        storage.set(key100, '1');
      }
    }
  }
}
