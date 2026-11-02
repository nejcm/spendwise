import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from '../types';
import { getGlobalBudget, getGlobalBudgetSpend } from '@/features/stats/global-budget-queries';
import { currentMonthRange, currentYearMonth, currentYearRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { getAppState } from '@/lib/store/store';
import { getBudgetSpendForMonth } from '../queries';
import { send } from '../send';

function budgetAlertKey(categoryId: string, yearMonth: string, threshold: 80 | 100) {
  return `notif.budget.${categoryId}.${yearMonth}.${threshold}`;
}

function globalBudgetAlertKey(period: string, threshold: 80 | 100) {
  return `notif.budget.global.${period}.${threshold}`;
}

export async function checkBudgetAlerts(
  db: SQLiteDatabase,
  settings: NotificationSettings,
): Promise<void> {
  if (settings.budgetAlerts === false) return;

  const { monthStartDay } = getAppState();
  // Day 1 keeps the pre-setting keys so existing alert flags still match.
  const startSuffix = monthStartDay === 1 ? '' : `@${monthStartDay}`;
  const yearMonth = currentYearMonth();
  const monthKey = `${yearMonth}${startSuffix}`;
  const [monthStart, monthEnd] = currentMonthRange();

  const [categories, globalBudget] = await Promise.all([
    getBudgetSpendForMonth(db, monthStart, monthEnd),
    getGlobalBudget(db),
  ]);

  for (const cat of categories) {
    const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;

    if (pct >= 80) {
      const key80 = budgetAlertKey(cat.id, monthKey, 80);
      if (storage.getString(key80) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          translate('notifications.budget_approaching', { name: cat.name, percent: Math.round(pct) }),
        );
        storage.set(key80, '1');
      }
    }

    if (pct >= 100) {
      const key100 = budgetAlertKey(cat.id, monthKey, 100);
      if (storage.getString(key100) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          translate('notifications.budget_exceeded', { name: cat.name }),
        );
        storage.set(key100, '1');
      }
    }
  }

  if (globalBudget && globalBudget.amountCents) {
    const isYearly = globalBudget.type === 'yearly';
    const year = yearMonth.slice(0, 4);
    const [rangeStart, rangeEnd] = isYearly ? currentYearRange() : [monthStart, monthEnd];
    const alertPeriod = isYearly ? `${year}${startSuffix}` : monthKey;
    const spent = await getGlobalBudgetSpend(db, rangeStart, rangeEnd);
    const pct = (spent / globalBudget.amountCents) * 100;

    if (pct >= 80) {
      const key80 = globalBudgetAlertKey(alertPeriod, 80);
      if (storage.getString(key80) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          isYearly
            ? translate('notifications.global_budget_approaching_yearly', { percent: Math.round(pct) })
            : translate('notifications.global_budget_approaching', { percent: Math.round(pct) }),
        );
        storage.set(key80, '1');
      }
    }

    if (pct >= 100) {
      const key100 = globalBudgetAlertKey(alertPeriod, 100);
      if (storage.getString(key100) !== '1') {
        await send(
          translate('notifications.budget_alert_title'),
          isYearly
            ? translate('notifications.global_budget_exceeded_yearly')
            : translate('notifications.global_budget_exceeded'),
        );
        storage.set(key100, '1');
      }
    }
  }
}
