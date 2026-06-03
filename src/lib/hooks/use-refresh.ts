import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

type RefreshQueryKey = readonly unknown[];

export function useRefresh(refreshKeys?: readonly RefreshQueryKey[]) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshKeys) {
        await Promise.all(
          refreshKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
      }
      else {
        await queryClient.invalidateQueries();
      }
    }
    finally {
      setRefreshing(false);
    }
  }, [queryClient, refreshKeys]);

  return { refreshing, onRefresh };
}
