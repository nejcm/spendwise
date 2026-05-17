import type { GlobalBudget } from './global-budget-queries';
import type { BudgetPeriodSelection, MonthSlice } from './types';
import type { CategoryBudgetRow } from '@/features/notifications/queries';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { getBudgetSpendForMonth } from '@/features/notifications/queries';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { getMonthBoundaries } from '@/lib/date/helpers';
import { getGlobalBudget, getGlobalBudgetSpend, setGlobalBudget } from './global-budget-queries';
import { getBudgetSelectionBoundaries, scaleGlobalBudget } from './helpers';

export type MonthBudgetResult = {
  year: number;
  month: number;
  categories: CategoryBudgetRow[];
  totalBudget: number;
  totalSpent: number;
};

type SingleBudgetSelection = Extract<BudgetPeriodSelection, { mode: 'day' | 'month' }>;

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
    onSuccess: (_, budget) => {
      queryClient.setQueryData(queryKeys.globalBudget.all, budget);
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

function scaleCategoryBudgetRows(rows: CategoryBudgetRow[], selection: SingleBudgetSelection): CategoryBudgetRow[] {
  if (selection.mode === 'month') return rows;
  return rows.map((row) => ({
    ...row,
    budget: scaleGlobalBudget({ amountCents: row.budget, type: 'monthly' }, selection),
  }));
}

export function useBudgetStats(selection?: SingleBudgetSelection, enabled = true) {
  const db = useSQLiteContext();
  const now = new Date();
  const period = selection ?? { mode: 'month', year: now.getFullYear(), month: now.getMonth() + 1 };
  const [start, end] = getBudgetSelectionBoundaries(period);

  return useQuery({
    queryKey: queryKeys.budgetStats.byPeriod(start, end),
    enabled,
    queryFn: async () => {
      const rows = scaleCategoryBudgetRows(await getBudgetSpendForMonth(db, start, end), period);

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
