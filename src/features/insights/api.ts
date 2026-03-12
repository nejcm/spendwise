import type { CategorySpend, MonthlyTotals } from './types';

import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { eq, gte, sql } from 'drizzle-orm';

import { getCurrentMonthRange } from '@/lib/date/helpers';
import { db } from '@/lib/drizzle/db';
import { categories, transactions } from '@/lib/drizzle/schema';

const keys = {
  categorySpend: (month: string) => ['insights', 'category-spend', month] as const,
  monthlyTrend: (months: number) => ['insights', 'monthly-trend', months] as const,
};

export function useCategorySpend(month: string) {
  return useQuery({
    queryKey: keys.categorySpend(month),
    queryFn: () => getCategorySpend(month),
  });
}

export function useMonthlyTrend(numMonths: number = 6) {
  return useQuery({
    queryKey: keys.monthlyTrend(numMonths),
    queryFn: () => getMonthlyTrend(numMonths),
  });
}

// ─── Database Functions ───

async function getCategorySpend(month: string): Promise<CategorySpend[]> {
  const [startDate, nextMonth] = getCurrentMonthRange(month);

  const rows = await db
    .select({
      category_id: categories.id,
      category_name: categories.name,
      category_color: categories.color,
      category_icon: categories.icon,
      total: sql<number>`COALESCE(SUM(CASE
        WHEN ${transactions.type} = 'expense' AND ${transactions.date} >= ${startDate} AND ${transactions.date} < ${nextMonth}
        THEN ${transactions.amount}
        ELSE 0
      END), 0)`,
    })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .groupBy(categories.id, categories.name, categories.color)
    .orderBy(sql`total DESC`);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

async function getMonthlyTrend(numMonths: number): Promise<MonthlyTotals[]> {
  const startDate = format(subMonths(new Date(), numMonths - 1), 'yyyy-MM-01');

  const rows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${transactions.date})`,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(gte(transactions.date, startDate))
    .groupBy(sql`strftime('%Y-%m', ${transactions.date})`);

  // Fill in months with no transactions so the chart always shows numMonths bars
  return Array.from({ length: numMonths }, (_, i) => {
    const month = format(subMonths(new Date(), numMonths - 1 - i), 'yyyy-MM');
    return rows.find((r) => r.month === month) ?? { month, income: 0, expense: 0 };
  });
}
