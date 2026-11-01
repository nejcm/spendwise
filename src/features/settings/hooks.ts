import type { DeleteDataSelection } from './queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { invalidateFor, queryKeys } from '@/lib/data';
import { getAppState, setTransactionFormPrefs } from '@/lib/store/store';
import * as queries from './queries';

export function useDataCounts() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.dataCounts,
    queryFn: () => queries.getDataCounts(db),
  });
}

export function useDeleteData() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (selection: DeleteDataSelection) => queries.deleteData(db, selection),
    onSuccess: (_, selection) => {
      const prefs = getAppState().formPrefs.transactionForm;
      setTransactionFormPrefs({
        ...prefs,
        category_id: selection.categories ? undefined : prefs.category_id,
        account_id: selection.accounts ? undefined : prefs.account_id,
      });
      invalidateFor(queryClient, 'transaction', 'scheduledTransaction', 'category', 'account');
    },
  });
}
