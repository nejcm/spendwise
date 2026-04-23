import type { SQLiteDatabase } from 'expo-sqlite';

import type { BudgetOverviewItem } from './types';

import { format, startOfMonth, subMonths } from 'date-fns';

import { generateId } from '@/lib/sqlite';
import { getBudgetMonthlyHistory, getLastRolloverMonth, upsertBudgetRollover } from './queries';

function toYearMonth(date: Date): number {
  return Number(format(date, 'yyyyMM'));
}

/**
 * For each rollover-enabled category, compute and persist the rollover amount
 * for the previous calendar month if it hasn't been stored yet.
 * Called lazily when the Budgets screen mounts.
 */
export async function computeAndStorePendingRollovers(
  db: SQLiteDatabase,
  categories: BudgetOverviewItem[],
): Promise<void> {
  const now = new Date();
  const prevMonthStart = subMonths(startOfMonth(now), 1);
  const prevYearMonth = toYearMonth(prevMonthStart);
  const currentYearMonth = toYearMonth(startOfMonth(now));

  for (const cat of categories) {
    if (!cat.budget_rollover || !cat.budget) continue;

    const lastStored = await getLastRolloverMonth(db, cat.category_id);

    // Already computed for this or a later month — skip
    if (lastStored !== null && lastStored >= prevYearMonth) continue;

    // Fetch previous month's actual spend
    const history = await getBudgetMonthlyHistory(db, cat.category_id, 2);
    const prevEntry = history.find((h) => h.year_month === prevYearMonth);
    const prevSpent = prevEntry?.spent ?? 0;

    // rollover = budget - spent (positive = surplus, negative = overspend)
    const rolloverAmount = cat.budget - prevSpent;

    await upsertBudgetRollover(
      db,
      generateId(),
      cat.category_id,
      prevYearMonth,
      rolloverAmount,
    );
  }

  // Ensure there's a zero-rollover placeholder for current month
  // so the overview query always finds a row (preventing stale prev-month data)
  void currentYearMonth; // not stored — overview query uses prev month's rollover
}

/**
 * Calculate the effective budget for a category for the current month,
 * accounting for rollover from the previous month.
 */
export function effectiveBudget(baseBudget: number, rolloverAmount: number): number {
  return Math.max(0, baseBudget + rolloverAmount);
}

/**
 * Format YYYYMM integer as "Jan 2025" style string.
 */
export function formatYearMonth(yearMonth: number): string {
  const y = Math.floor(yearMonth / 100);
  const m = yearMonth % 100;
  return format(new Date(y, m - 1, 1), 'MMM yyyy');
}

/**
 * Calculate remaining daily budget for the current month.
 */
export function dailyProjection(remainingCents: number): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - now.getDate() + 1;
  if (daysLeft <= 0 || remainingCents <= 0) return 0;
  return Math.floor(remainingCents / daysLeft);
}

export function daysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(1, lastDay - now.getDate() + 1);
}
