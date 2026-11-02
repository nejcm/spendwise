import type { GlobalBudget } from './global-budget-queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { getBillSpend, getGlobalBudget, getGlobalBudgetSpend, setGlobalBudget } from './global-budget-queries';

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

export function useBillSpend(startDate: number, endDate: number, enabled = true) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.globalBudget.billSpend(startDate, endDate),
    enabled,
    queryFn: () => getBillSpend(db, startDate, endDate),
  });
}
