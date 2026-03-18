import type { BudgetFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';

import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';

import * as queries from './queries';

export function useBudgets() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: () => queries.getBudgets(db),
  });
}

export function useBudgetWithProgress(id: string) {
  const db = useSQLiteContext();
  const month = format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: queryKeys.budgets.progress(id, month),
    queryFn: () => queries.getBudgetWithProgress(db, id, month),
    enabled: !!id,
  });
}

export function useBudgetsOverview() {
  const db = useSQLiteContext();
  const month = format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: queryKeys.budgets.overview(month),
    queryFn: () => queries.getBudgetsOverview(db, month),
  });
}

export function useCreateBudget() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BudgetFormData) => queries.createBudget(db, data),
    onSuccess: () => {
      invalidateFor(queryClient, 'budget');
    },
  });
}

export function useUpdateBudget() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: BudgetFormData }) =>
      queries.updateBudget(db, params.id, params.data),
    onSuccess: () => {
      invalidateFor(queryClient, 'budget');
    },
  });
}

export function useDeleteBudget() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queries.deleteBudget(db, id),
    onSuccess: () => {
      invalidateFor(queryClient, 'budget');
    },
  });
}
