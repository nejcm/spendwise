import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthSummary } from '../transactions/types';
import type { CategorySpend, DailyTrendTotal, MonthlyTotals } from './types';

import { addMonths, startOfMonth, subMonths } from 'date-fns';
import { dateToUnix } from '@/lib/date/helpers';

// ─── Read Queries ───

export async function getSummaryByRange(
  db: SQLiteDatabase,
  startDate: number | undefined,
  endDate: number | undefined,
): Promise<MonthSummary> {
  const hasRange = !!startDate && !!endDate;
  const row = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
     FROM transactions
     ${hasRange ? 'WHERE date >= ? AND date < ?' : ''}`,
    hasRange ? [startDate, endDate] : [],
  );
  const income = row?.income ?? 0;
  const expense = row?.expense ?? 0;
  return { income, expense, balance: income - expense };
}

export async function getCategorySpendByRange(
  db: SQLiteDatabase,
  startDate: number | undefined,
  endDate: number | undefined,
): Promise<CategorySpend[]> {
  const hasRange = !!startDate && !!endDate;
  const rows = await db.getAllAsync<Omit<CategorySpend, 'percentage'>>(
    `SELECT
       c.id as category_id,
       c.name as category_name,
       c.color as category_color,
       c.icon as category_icon,
       c.budget as category_budget,
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
       AND t.type IN ('income','expense') ${hasRange ? 'AND t.date >= ? AND t.date < ?' : ''}
     GROUP BY c.id, c.name, c.color, c.icon, c.budget, c.sort_order
     ORDER BY c.sort_order ASC`,
    hasRange ? [startDate, endDate] : [],
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

export async function getTrendByRange(
  db: SQLiteDatabase,
  startDate: number | undefined,
  endDate: number | undefined,
): Promise<DailyTrendTotal[]> {
  const hasRange = !!startDate && !!endDate;
  return db.getAllAsync<DailyTrendTotal>(
    `SELECT
       date,
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
     FROM transactions
     ${hasRange ? 'WHERE date >= ? AND date < ?' : ''}
     GROUP BY date
     ORDER BY date ASC`,
    hasRange ? [startDate, endDate] : [],
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
       c.budget as category_budget,
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
     GROUP BY c.id, c.name, c.color, c.icon, c.budget, c.sort_order
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
  if (numMonths <= 0) return [];

  const now = new Date();
  const firstMonth = startOfMonth(subMonths(now, numMonths - 1));
  const afterLastMonth = startOfMonth(addMonths(now, 1));
  const startDate = dateToUnix(firstMonth);
  const endDate = dateToUnix(afterLastMonth);

  const rows = await db.getAllAsync<MonthlyTotals>(
    `SELECT
       strftime('%Y-%m', date, 'unixepoch', 'localtime') as month,
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?
     GROUP BY month
     ORDER BY month ASC`,
    [startDate, endDate],
  );

  const totalsByMonth = new Map(rows.map((row) => [row.month, row]));
  const result: MonthlyTotals[] = [];

  for (let i = 0; i < numMonths; i++) {
    const date = addMonths(firstMonth, i);
    const year = date.getFullYear();
    const monthLabel = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const row = totalsByMonth.get(monthLabel);
    result.push({ month: monthLabel, income: row?.income ?? 0, expense: row?.expense ?? 0 });
  }

  return result;
}
