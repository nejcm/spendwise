import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategorySpend, MonthlyTotals } from './types';

import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';

const keys = {
  categorySpend: (month: string) => ['insights', 'category-spend', month] as const,
  monthlyTrend: (months: number) => ['insights', 'monthly-trend', months] as const,
};

export function useCategorySpend(month: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.categorySpend(month),
    queryFn: () => getCategorySpend(db, month),
  });
}

export function useMonthlyTrend(numMonths: number = 6) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.monthlyTrend(numMonths),
    queryFn: () => getMonthlyTrend(db, numMonths),
  });
}

// ─── Database Functions ───

async function getCategorySpend(db: SQLiteDatabase, month: string): Promise<CategorySpend[]> {
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01`;
  const nextMonth = Number(m) === 12
    ? `${Number(year) + 1}-01-01`
    : `${year}-${String(Number(m) + 1).padStart(2, '0')}-01`;

  const rows = await db.getAllAsync<Omit<CategorySpend, 'percentage'>>(
    `SELECT
       COALESCE(t.category_id, 'uncategorized') as category_id,
       COALESCE(c.name, 'Uncategorized') as category_name,
       COALESCE(c.color, '#90A4AE') as category_color,
       SUM(t.amount) as total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date < ?
     GROUP BY t.category_id
     ORDER BY total DESC`,
    [startDate, nextMonth],
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
