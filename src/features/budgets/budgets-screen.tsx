import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';

import { RefreshControl } from 'react-native';
import { FocusAwareStatusBar, ScrollView, View } from '@/components/ui';
import { SkeletonBox } from '@/components/ui/skeleton';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { defaultStyles } from '@/lib/theme/styles';

import { BudgetCategoryList } from './budget-category-list';
import { BudgetRecommendations, computeRecommendations } from './budget-recommendations';
import { BudgetSummaryHeader } from './budget-summary-header';
import { useBudgetOverview, useUnbudgetedCategories } from './hooks';
import { computeAndStorePendingRollovers } from './rollover';

export function BudgetsScreen() {
  const db = useSQLiteContext();
  const { data: overview = [], isLoading: overviewLoading } = useBudgetOverview();
  const { data: unbudgeted = [] } = useUnbudgetedCategories();
  const { refreshing, onRefresh } = useRefresh();

  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    if (overview.length > 0) {
      computeAndStorePendingRollovers(db, overview).catch(() => {});
    }
  }, [db, overview]);

  const histories = useCategoryHistories(overview.map((i) => i.category_id));

  const recommendations = React.useMemo(() => {
    const recs = computeRecommendations(overview, histories);
    return recs.filter((r) => !dismissedIds.has(r.category_id));
  }, [overview, histories, dismissedIds]);

  const handleDismiss = (categoryId: string) => {
    setDismissedIds((prev) => new Set([...prev, categoryId]));
  };

  if (overviewLoading) {
    return (
      <View className="flex-1 gap-4 px-4 pt-4">
        <SkeletonBox height={140} className="rounded-2xl" />
        <SkeletonBox height={72} className="rounded-2xl" />
        <SkeletonBox height={72} className="rounded-2xl" />
        <SkeletonBox height={72} className="rounded-2xl" />
      </View>
    );
  }

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1"
        style={defaultStyles.transparentBg}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-0 pt-4 pb-8">
          <BudgetSummaryHeader items={overview} recommendationCount={recommendations.length} />
          <BudgetRecommendations recommendations={recommendations} onDismiss={handleDismiss} />
          <BudgetCategoryList items={overview} unbudgeted={unbudgeted} />
        </View>
      </ScrollView>
    </>
  );
}

function useCategoryHistories(categoryIds: string[]) {
  const db = useSQLiteContext();
  const [histories, setHistories] = React.useState<{ categoryId: string; yearMonth: number; budget: number; spent: number }[]>([]);

  React.useEffect(() => {
    if (categoryIds.length === 0) return;

    const fetchAll = async () => {
      const { getBudgetMonthlyHistory } = await import('./queries');
      const allHistories: { categoryId: string; yearMonth: number; budget: number; spent: number }[] = [];
      for (const id of categoryIds) {
        const hist = await getBudgetMonthlyHistory(db, id, 6);
        for (const h of hist) {
          allHistories.push({ categoryId: id, yearMonth: h.year_month, budget: h.budget, spent: h.spent });
        }
      }
      setHistories(allHistories);
    };

    fetchAll().catch(() => {});
  }, [categoryIds, db]);

  return histories;
}
