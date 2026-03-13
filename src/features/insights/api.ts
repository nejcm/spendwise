import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthSummary } from '../transactions/types';
import type { CategorySpend, MonthlyTotals } from './types';

import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';
import { getCurrentMonthRange } from '../../lib/date/helpers';

const keys = {
  categorySpend: (month: string) => ['insights', 'category-spend', month] as const,
  monthlyTrend: (months: number) => ['insights', 'monthly-trend', months] as const,
  yearlySummary: (year: number) => ['insights', 'yearly-summary', year] as const,
  categorySpendYear: (year: number) => ['insights', 'category-spend-year', year] as const,
};

export function useCategorySpend(date: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.categorySpend(date),
    queryFn: () => getCategorySpend(db, date),
  });
}

export function useMonthlyTrend(numMonths: number = 6) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.monthlyTrend(numMonths),
    queryFn: () => getMonthlyTrend(db, numMonths),
  });
}

export function useYearlySummary(year: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.yearlySummary(year),
    queryFn: () => getYearlySummary(db, year),
  });
}

export function useCategorySpendForYear(year: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.categorySpendYear(year),
    queryFn: () => getCategorySpendForYear(db, year),
  });
}

// ─── Database Functions ───

async function getCategorySpend(db: SQLiteDatabase, date: string): Promise<CategorySpend[]> {
  const [startDate, nextMonth] = getCurrentMonthRange(date);

  const rows = await db.getAllAsync<Omit<CategorySpend, 'percentage'>>(
    `SELECT
       c.id as category_id,
       c.name as category_name,
       c.color as category_color,
       c.icon as category_icon,
       c.type as category_type,
       c.sort_order as sort_order,
       COALESCE(SUM(CASE
         WHEN t.type = c.type AND t.date >= ? AND t.date < ?
         THEN t.amount
         ELSE 0
       END), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
     GROUP BY c.id, c.name, c.color, c.type, c.sort_order
     ORDER BY c.sort_order ASC`,
    [startDate, nextMonth],
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

async function getYearlySummary(db: SQLiteDatabase, year: number): Promise<MonthSummary> {
  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-01`;

  const row = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?`,
    [startDate, endDate],
  );

  const income = row?.income ?? 0;
  const expense = row?.expense ?? 0;
  return { income, expense, balance: income - expense };
}

async function getCategorySpendForYear(db: SQLiteDatabase, year: number): Promise<CategorySpend[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-01`;

  const rows = await db.getAllAsync<Omit<CategorySpend, 'percentage'>>(
    `SELECT
       c.id as category_id,
       c.name as category_name,
       c.color as category_color,
       c.icon as category_icon,
       c.type as category_type,
       c.sort_order as sort_order,
       COALESCE(SUM(CASE
         WHEN t.type = c.type AND t.date >= ? AND t.date < ?
         THEN t.amount
         ELSE 0
       END), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
     GROUP BY c.id, c.name, c.color, c.type, c.sort_order
     ORDER BY c.sort_order ASC`,
    [startDate, endDate],
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

async function getMonthlyTrend(db: SQLiteDatabase, numMonths: number): Promise<MonthlyTotals[]> {
  const now = new Date();
  const result: MonthlyTotals[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const month = format(date, 'yyyy-MM');
    const [year, m] = month.split('-');
    const startDate = `${year}-${m}-01`;
    const nextMonth = Number(m) === 12
      ? `${Number(year) + 1}-01-01`
      : `${year}-${String(Number(m) + 1).padStart(2, '0')}-01`;

    const row = await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE date >= ? AND date < ?`,
      [startDate, nextMonth],
    );

    result.push({ month, income: row?.income ?? 0, expense: row?.expense ?? 0 });
  }

  return result;
}
