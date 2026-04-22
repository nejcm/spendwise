import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { queryKeys } from '@/lib/data/query-keys';
import { getRecommendations } from './queries';
import { dismissRecommendation, getDismissedRecommendationIds } from './storage';

export function useRecommendations() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.recommendations.home,
    queryFn: () => getRecommendations(db),
  });
}

export function useVisibleRecommendations() {
  const query = useRecommendations();
  const [dismissedIds, setDismissedIds] = React.useState<string[]>(() => getDismissedRecommendationIds());

  const dismiss = React.useCallback((id: string) => {
    dismissRecommendation(id);
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const recommendations = React.useMemo(
    () => (query.data ?? []).filter((recommendation) => !dismissedIds.includes(recommendation.id)),
    [query.data, dismissedIds],
  );

  return {
    ...query,
    recommendations,
    dismiss,
  };
}
