import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthSummary } from '../transactions/types';
import type { CategorySpend, MonthlyTotals, WeeklyTotals } from './types';

import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';

const keys = {
  categorySpendRange: (startDate: string, endDate: string) => ['insights', 'category-spend-range', startDate, endDate] as const,
  monthlyTrend: (months: number) => ['insights', 'monthly-trend', months] as const,
  monthlyTrendForYear: (year: number) => ['insights', 'monthly-trend-year', year] as const,
  yearlySummary: (year: number) => ['insights', 'yearly-summary', year] as const,
  categorySpendYear: (year: number) => ['insights', 'category-spend-year', year] as const,
  weeklyTrend: (yearMonth: string) => ['insights', 'weekly-trend', yearMonth] as const,
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

export function useMonthlyTrend(numMonths: number = 6) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.monthlyTrend(numMonths),
    queryFn: () => getMonthlyTrend(db, numMonths),
  });
}

export function useMonthlyTrendForYear(year: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.monthlyTrendForYear(year),
    queryFn: () => getMonthlyTrendForYear(db, year),
  });
}

export function useYearlySummary(year: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.yearlySummary(year),
    queryFn: () => getYearlySummary(db, year),
  });
}

export function useWeeklyTrend(yearMonth: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.weeklyTrend(yearMonth),
    queryFn: () => getWeeklyTrend(db, yearMonth),
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

async function getWeeklyTrend(db: SQLiteDatabase, yearMonth: string): Promise<WeeklyTotals[]> {
  const [year, month] = yearMonth.split('-');
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const weekRanges = [
    { week: 1, start: 1, end: 7 },
    { week: 2, start: 8, end: 14 },
    { week: 3, start: 15, end: 21 },
    { week: 4, start: 22, end: 28 },
  ];
  if (daysInMonth > 28) {
    weekRanges.push({ week: 5, start: 29, end: daysInMonth });
  }

  const result: WeeklyTotals[] = [];
  for (const { week, start, end } of weekRanges) {
    const startDate = `${year}-${month}-${String(start).padStart(2, '0')}`;
    const endDay = Math.min(end, daysInMonth);
    const nextDay = endDay + 1;
    const nextDate = nextDay > daysInMonth
      ? (Number(month) === 12
          ? `${Number(year) + 1}-01-01`
          : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`)
      : `${year}-${month}-${String(nextDay).padStart(2, '0')}`;

    const row = await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE date >= ? AND date < ?`,
      [startDate, nextDate],
    );

    result.push({ week, label: `W${week}`, income: row?.income ?? 0, expense: row?.expense ?? 0 });
  }
  return result;
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

async function getMonthlyTrendForYear(db: SQLiteDatabase, year: number): Promise<MonthlyTotals[]> {
  const result: MonthlyTotals[] = [];

  for (let m = 1; m <= 12; m++) {
    const month = `${year}-${String(m).padStart(2, '0')}`;
    const startDate = `${month}-01`;
    const nextMonth = m === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(m + 1).padStart(2, '0')}-01`;

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
