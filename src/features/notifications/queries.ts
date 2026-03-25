import type { SQLiteDatabase } from 'expo-sqlite';

import { startOfMonth } from 'date-fns';
import { dateToUnix } from '@/lib/date/helpers';

export type CategoryBudgetRow = {
  id: string;
  name: string;
  budget: number;
  spent: number;
};

export type AccountBalanceRow = {
  id: string;
  name: string;
  baseBalance: number;
};

export type WeekSummaryRow = {
  income: number;
  expense: number;
};

export async function getBudgetSpendForMonth(
  db: SQLiteDatabase,
  monthStart: number,
  monthEnd: number,
): Promise<CategoryBudgetRow[]> {
  return db.getAllAsync<CategoryBudgetRow>(
    `SELECT
       c.id,
       c.name,
       c.budget,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0) AS spent
     FROM categories c
     LEFT JOIN transactions t
       ON t.category_id = c.id
       AND t.type = 'expense'
       AND t.date >= ?
       AND t.date < ?
     WHERE c.budget IS NOT NULL AND c.budget > 0
     GROUP BY c.id, c.name, c.budget`,
    [monthStart, monthEnd],
  );
}

export async function getAccountBalances(
  db: SQLiteDatabase,
): Promise<AccountBalanceRow[]> {
  return db.getAllAsync<AccountBalanceRow>(
    `SELECT
       a.id,
       a.name,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.baseAmount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN t.baseAmount ELSE 0 END), 0)
       AS baseBalance
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     WHERE a.is_archived = 0
     GROUP BY a.id, a.name`,
  );
}

export async function getWeeklySpendSummary(
  db: SQLiteDatabase,
  weekStart: number,
  weekEnd: number,
): Promise<WeekSummaryRow> {
  const row = await db.getFirstAsync<WeekSummaryRow>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) AS expense
     FROM transactions
     WHERE date >= ? AND date < ?`,
    [weekStart, weekEnd],
  );
  return row ?? { income: 0, expense: 0 };
}

/** Returns [monthStartUnix, nextMonthStartUnix] for the current calendar month. */
export function currentMonthRange(): [number, number] {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
  return [dateToUnix(monthStart), dateToUnix(nextMonthStart)];
}
