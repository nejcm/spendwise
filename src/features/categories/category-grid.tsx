import type { CurrencyKey } from '../currencies';
import type { CategorySpend } from '@/features/insights/types';
import type { PeriodSelection } from '@/lib/store';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { FormattedCurrency, Text } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { Lightbulb } from '@/components/ui/icon';
import { scaleBudgetForPeriod } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { NoDataCard } from '../../components/no-data-card';

export type CategoryGridProps = {
  categories: CategorySpend[];
  onReorder: (items: Array<{ id: string; sort_order: number }>) => void;
  onAddPress: () => void;
  onPress: (category?: CategorySpend) => void;
};

export const CategoryGrid = React.memo(({
  categories,
  onReorder,
  onAddPress,
  onPress,
}: CategoryGridProps) => {
  const currency = useAppStore.use.currency();
  const periodSelection = useAppStore.use.periodSelection();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  function handleDragEnd(params: { data: CategorySpend[] }) {
    const updates = params.data.map((item, idx) => ({ id: item.category_id, sort_order: idx }));
    onReorder(updates);
  }

  return (
    <Animated.ScrollView ref={scrollRef} className="flex-1 bg-background">
      <View className="px-4 pb-4">
        {categories.length === 0
          ? (
              <NoDataCard onPress={onAddPress} label={translate('common.add')} />
            )
          : (
              <Sortable.Grid
                data={categories}
                columns={2}
                columnGap={10}
                rowGap={10}
                hapticsEnabled
                scrollableRef={scrollRef}
                keyExtractor={(item) => item.category_id}
                onDragEnd={handleDragEnd}
                renderItem={({ item }) => (
                  <CategoryCard
                    item={item}
                    currency={currency}
                    periodSelection={periodSelection}
                    onPress={onPress}
                  />
                )}
              />
            )}
        <View className="mt-6 flex-row items-center justify-center gap-2">
          <Lightbulb className="size-3 text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">
            {translate('categories.sorting_tips')}
          </Text>
        </View>
      </View>
    </Animated.ScrollView>
  );
});

export type CategoryGridCellProps = {
  item: CategorySpend;
  currency: CurrencyKey;
  periodSelection: PeriodSelection;
  onPress: (category: CategorySpend) => void;
};

function CategoryCard({ item, currency, periodSelection, onPress }: CategoryGridCellProps) {
  const emoji = item.category_icon && item.category_icon.trim() ? item.category_icon : item.category_name.charAt(0).toUpperCase();
  const showBudget = item.category_budget != null && item.category_budget > 0;
  const monthlyBudget = item.category_budget ?? 0;
  const scaledBudget = showBudget ? scaleBudgetForPeriod(monthlyBudget, periodSelection) : 0;
  const isMonthView = periodSelection.mode === 'month';

  return (
    <Pressable onPress={() => onPress(item)} className="min-h-[90] flex-1 justify-center rounded-xl bg-card px-3 py-2">
      <View
        className="mb-1 flex-row items-center justify-start gap-2"
      >
        <Text className="text-xl">{emoji}</Text>
        <Text className="w-full text-sm text-muted-foreground" numberOfLines={1}>
          {item.category_name}
        </Text>
      </View>
      {item.total !== undefined && (
        <FormattedCurrency value={item.total} currency={currency} className="font-medium" numberOfLines={1} />
      )}
      {showBudget && (
        <BudgetProgressBar
          spent={item.expense_total}
          budget={scaledBudget}
          monthlyBudget={!isMonthView ? monthlyBudget : undefined}
          currency={currency}
          className="mt-0.5"
        />
      )}
    </Pressable>
  );
}
