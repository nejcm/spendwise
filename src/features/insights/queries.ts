import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthSummary } from '../transactions/types';
import type { CategorySpend, DailyTrendTotal, MonthlyTotals } from './types';

import { subMonths } from 'date-fns';
import { dateToUnix } from '@/lib/date/helpers';

// ─── Read Queries ───

export async function getSummaryByRange(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
): Promise<MonthSummary> {
  const row = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?`,
    [startDate, endDate],
  );
  const income = row?.income ?? 0;
  const expense = row?.expense ?? 0;
  return { income, expense, balance: income - expense };
}

export async function getCategorySpendByRange(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
): Promise<CategorySpend[]> {
  const rows = await db.getAllAsync<Omit<CategorySpend, 'percentage'>>(
    `SELECT
       c.id as category_id,
       c.name as category_name,
       c.color as category_color,
       c.icon as category_icon,
       c.sort_order as sort_order,
       COALESCE(SUM(t.baseAmount), 0) as total,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0) as income_total,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0) as expense_total,
       CASE
         WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0) >
              COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0)
         THEN 'income'
         ELSE 'expense'
       END as category_type
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.type IN ('income','expense') AND t.date >= ? AND t.date < ?
     GROUP BY c.id, c.name, c.color, c.icon, c.sort_order
     ORDER BY c.sort_order ASC`,
    [startDate, endDate],
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

export async function getTrendByRange(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
): Promise<DailyTrendTotal[]> {
  return db.getAllAsync<DailyTrendTotal>(
    `SELECT
       date,
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?
     GROUP BY date
     ORDER BY date ASC`,
    [startDate, endDate],
  );
}

export async function getYearlySummary(
  db: SQLiteDatabase,
  year: number,
): Promise<MonthSummary> {
  const startDate = dateToUnix(new Date(year, 0, 1));
  const endDate = dateToUnix(new Date(year + 1, 0, 1));

  const row = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?`,
    [startDate, endDate],
  );

  const income = row?.income ?? 0;
  const expense = row?.expense ?? 0;
  return { income, expense, balance: income - expense };
}

export async function getCategorySpendForYear(
  db: SQLiteDatabase,
  year: number,
): Promise<CategorySpend[]> {
  const startDate = dateToUnix(new Date(year, 0, 1));
  const endDate = dateToUnix(new Date(year + 1, 0, 1));

  const rows = await db.getAllAsync<Omit<CategorySpend, 'percentage'>>(
    `SELECT
       c.id as category_id,
       c.name as category_name,
       c.color as category_color,
       c.icon as category_icon,
       c.sort_order as sort_order,
       COALESCE(SUM(t.baseAmount), 0) as total,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0) as income_total,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0) as expense_total,
       CASE
         WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0) >
              COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0)
         THEN 'income'
         ELSE 'expense'
       END as category_type
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.type IN ('income','expense') AND t.date >= ? AND t.date < ?
     GROUP BY c.id, c.name, c.color, c.icon, c.sort_order
     ORDER BY c.sort_order ASC`,
    [startDate, endDate],
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

export async function getMonthlyTrend(
  db: SQLiteDatabase,
  numMonths: number,
): Promise<MonthlyTotals[]> {
  const now = new Date();
  const result: MonthlyTotals[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    const startDate = dateToUnix(new Date(year, month, 1));
    const endDate = dateToUnix(new Date(year, month + 1, 1));
    const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;

    const row = await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE date >= ? AND date < ?`,
      [startDate, endDate],
    );

    result.push({ month: monthLabel, income: row?.income ?? 0, expense: row?.expense ?? 0 });
  }

  return result;
}
