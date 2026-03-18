import type { GoalFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';

import * as queries from './queries';

export function useGoals() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: () => queries.getGoals(db),
  });
}

export function useGoal(id: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => queries.getGoalById(db, id),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GoalFormData) => queries.createGoal(db, data),
    onSuccess: () => invalidateFor(queryClient, 'goal'),
  });
}

export function useUpdateGoal() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; data: GoalFormData }) =>
      queries.updateGoal(db, params.id, params.data),
    onSuccess: () => invalidateFor(queryClient, 'goal'),
  });
}

export function useDeleteGoal() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteGoal(db, id),
    onSuccess: () => invalidateFor(queryClient, 'goal'),
  });
}

/**
 * Fixed: now uses 'goalContribution' entity which correctly invalidates
 * transactions, accounts/balance, total-balance, month-summary, AND insights.
 * Previously missed month-summary and insights invalidation.
 */
export function useAddGoalContribution() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { goalId: string; amount: string; accountId: string; date: string }) =>
      queries.addContribution(db, params),
    onSuccess: () => {
      invalidateFor(queryClient, 'goalContribution');
    },
  });
}
