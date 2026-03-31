import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export function useRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return { refreshing, onRefresh };
}
