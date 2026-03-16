import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthSummary } from '../transactions/types';
import type { CategorySpend, DailyTrendTotal, MonthlyTotals } from './types';

import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';

const keys = {
  categorySpendRange: (startDate: string, endDate: string) => ['insights', 'category-spend-range', startDate, endDate] as const,
  monthlyTrend: (months: number) => ['insights', 'monthly-trend', months] as const,
  trendRange: (startDate: string, endDate: string) => ['insights', 'trend-range', startDate, endDate] as const,
  yearlySummary: (year: number) => ['insights', 'yearly-summary', year] as const,
  categorySpendYear: (year: number) => ['insights', 'category-spend-year', year] as const,
  summaryRange: (startDate: string, endDate: string) => ['insights', 'summary-range', startDate, endDate] as const,
};

export function useSummaryByRange(startDate: string, endDate: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.summaryRange(startDate, endDate),
    queryFn: () => getSummaryByRange(db, startDate, endDate),
  });
}

export function useCategorySpendByRange(startDate: string, endDate: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.categorySpendRange(startDate, endDate),
    queryFn: () => getCategorySpendByRange(db, startDate, endDate),
  });
}

export function useTrendByRange(startDate: string, endDate: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.trendRange(startDate, endDate),
    queryFn: () => getTrendByRange(db, startDate, endDate),
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

async function getSummaryByRange(db: SQLiteDatabase, startDate: string, endDate: string): Promise<MonthSummary> {
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

async function getCategorySpendByRange(db: SQLiteDatabase, startDate: string, endDate: string): Promise<CategorySpend[]> {
  const rows = await db.getAllAsync<Omit<CategorySpend, 'percentage'>>(
    `SELECT
       c.id as category_id,
       c.name as category_name,
       c.color as category_color,
       c.icon as category_icon,
       COALESCE(t.type, 'expense') as category_type,
       c.sort_order as sort_order,
       COALESCE(SUM(t.amount), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.type IN ('income','expense') AND t.date >= ? AND t.date < ?
     GROUP BY c.id, c.name, c.color, c.icon, COALESCE(t.type, 'expense'), c.sort_order
     ORDER BY c.sort_order ASC`,
    [startDate, endDate],
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

async function getTrendByRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string,
): Promise<DailyTrendTotal[]> {
  const rows = await db.getAllAsync<DailyTrendTotal>(
    `SELECT
       date,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?
     GROUP BY date
     ORDER BY date ASC`,
    [startDate, endDate],
  );

  return rows;
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
       COALESCE(t.type, 'expense') as category_type,
       c.sort_order as sort_order,
       COALESCE(SUM(t.amount), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.type IN ('income','expense') AND t.date >= ? AND t.date < ?
     GROUP BY c.id, c.name, c.color, c.icon, COALESCE(t.type, 'expense'), c.sort_order
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
