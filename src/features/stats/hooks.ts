import type { GlobalBudget } from './global-budget-queries';
import type { MonthSlice } from './types';
import type { CategoryBudgetRow } from '@/features/notifications/queries';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { getBudgetSpendForMonth } from '@/features/notifications/queries';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { getMonthBoundaries } from '@/lib/date/helpers';
import { getGlobalBudget, getGlobalBudgetSpend, setGlobalBudget } from './global-budget-queries';

export type MonthBudgetResult = {
  year: number;
  month: number;
  categories: CategoryBudgetRow[];
  totalBudget: number;
  totalSpent: number;
};

type MonthSelection = { year: number; month: number };

function sortBySpendRatio(rows: CategoryBudgetRow[]): CategoryBudgetRow[] {
  return [...rows].sort((a, b) => {
    const ra = a.budget > 0 ? a.spent / a.budget : 0;
    const rb = b.budget > 0 ? b.spent / b.budget : 0;
    return rb - ra;
  });
}

export function useGlobalBudget() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.globalBudget.all,
    queryFn: () => getGlobalBudget(db),
  });
}

export function useSetGlobalBudget() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (budget: GlobalBudget | null) => setGlobalBudget(db, budget),
    onSuccess: () => {
      invalidateFor(queryClient, 'globalBudget');
    },
  });
}

export function useGlobalBudgetSpend(startDate: number, endDate: number, enabled = true) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.globalBudget.spend(startDate, endDate),
    enabled,
    queryFn: () => getGlobalBudgetSpend(db, startDate, endDate),
  });
}

export function useBudgetStats(monthSel?: MonthSelection, enabled = true) {
  const db = useSQLiteContext();
  const now = new Date();
  const year = monthSel?.year ?? now.getFullYear();
  const month = monthSel?.month ?? (now.getMonth() + 1);

  return useQuery({
    queryKey: queryKeys.budgetStats.byMonth(year, month),
    enabled,
    queryFn: async () => {
      const [start, end] = getMonthBoundaries(year, month);
      const rows = await getBudgetSpendForMonth(db, start, end);

      return {
        categories: sortBySpendRatio(rows),
        totalBudget: rows.reduce((s, r) => s + r.budget, 0),
        totalSpent: rows.reduce((s, r) => s + r.spent, 0),
      };
    },
  });
}

export function useBudgetStatsByRange(slices: MonthSlice[]) {
  const db = useSQLiteContext();

  const results = useQueries({
    queries: slices.map(({ year, month }) => ({
      queryKey: queryKeys.budgetStats.byMonth(year, month),
      queryFn: async (): Promise<MonthBudgetResult> => {
        const [start, end] = getMonthBoundaries(year, month);
        const rows = await getBudgetSpendForMonth(db, start, end);

        return {
          year,
          month,
          categories: sortBySpendRatio(rows),
          totalBudget: rows.reduce((s, r) => s + r.budget, 0),
          totalSpent: rows.reduce((s, r) => s + r.spent, 0),
        };
      },
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const months = results
    .map((r) => r.data)
    .filter((d): d is MonthBudgetResult => d !== undefined);

  return {
    months,
    totalBudget: months.reduce((s, m) => s + m.totalBudget, 0),
    totalSpent: months.reduce((s, m) => s + m.totalSpent, 0),
    isLoading,
  };
}
