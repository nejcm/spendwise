import type { CurrencyKey } from '../currencies';
import type { CategorySpend } from '@/features/insights/types';
import type { PeriodSelection } from '@/lib/store';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

import Sortable from 'react-native-sortables';
import { NoDataCard } from '@/components/no-data-card';
import { Alert, FormattedCurrency, Text, View } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { Lightbulb, TrashIcon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { scaleBudgetForPeriod } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { bgColorOr, hexWithOpacity } from '@/lib/theme/colors';
import { useDeleteCategory } from './hooks';

export type CategoryGridProps = {
  categories: CategorySpend[];
  onReorder: (items: Array<{ id: string; sort_order: number }>) => void;
  onAddPress: () => void;
  onPress: (category?: CategorySpend) => void;
  onRefresh?: () => Promise<void> | void;
  editMode: boolean;
};

export const CategoryGrid = React.memo(({
  categories,
  onReorder,
  onAddPress,
  onPress,
  onRefresh,
  editMode,
}: CategoryGridProps) => {
  const currency = useAppStore.use.currency();
  const periodSelection = useAppStore.use.periodSelection();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const [refreshing, setRefreshing] = useState(false);
  const deleteCategory = useDeleteCategory();

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  function handleDragEnd(params: { data: CategorySpend[] }) {
    const updates = params.data.map((item, idx) => ({ id: item.category_id, sort_order: idx }));
    onReorder(updates);
  }

  const onDeletePress = React.useCallback((categoryId: string, name: string) => {
    Alert.alert(translate('common.delete'), translate('categories.delete_confirm', { name }), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(categoryId) },
    ]);
  }, [deleteCategory]);

  return (
    <Animated.ScrollView ref={scrollRef} className="flex-1 bg-background" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
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
                sortEnabled={editMode}
                scrollableRef={scrollRef}
                dimensionsAnimationType="none"
                itemEntering={null}
                itemExiting={null}
                itemsLayoutTransitionMode="reorder"
                keyExtractor={(item) => item.category_id}
                onDragEnd={handleDragEnd}
                renderItem={({ item }) => (
                  <CategoryCard
                    item={item}
                    currency={currency}
                    periodSelection={periodSelection}
                    onPress={onPress}
                    onDeletePress={editMode ? onDeletePress : undefined}
                  />
                )}
              />
            )}
        {editMode && (
          <View className="mt-6 flex-row items-center justify-center gap-2">
            <Lightbulb className="text-muted-foreground" size={14} />
            <Text className="text-sm text-muted-foreground">
              {translate('categories.sorting_tips')}
            </Text>
          </View>
        )}
      </View>
    </Animated.ScrollView>
  );
});

export type CategoryGridCellProps = {
  item: CategorySpend;
  currency: CurrencyKey;
  periodSelection: PeriodSelection;
  onPress: (category: CategorySpend) => void;
  onDeletePress?: (categoryId: string, name: string) => void;
};

function CategoryCard({ item, currency, periodSelection, onPress, onDeletePress }: CategoryGridCellProps) {
  const emoji = item.category_icon && item.category_icon.trim() ? item.category_icon : item.category_name.charAt(0).toUpperCase();
  const showBudget = item.category_budget != null && item.category_budget > 0;
  const monthlyBudget = item.category_budget ?? 0;
  const scaledBudget = showBudget ? scaleBudgetForPeriod(monthlyBudget, periodSelection) : 0;
  const isMonthView = periodSelection.mode === 'month';

  return (
    <View className="min-h-[88] flex-1 justify-center rounded-xl bg-card">
      {onDeletePress && (
        <IconButton
          size="sm"
          color="none"
          className="absolute top-1 right-1 z-10 bg-background/70"
          hitSlop={10}
          onPress={() => onDeletePress(item.category_id, item.category_name)}
        >
          <TrashIcon colorClassName="accent-muted-foreground" size={15} />
        </IconButton>
      )}
      <Pressable onPress={() => onPress(item)} className="flex-1 justify-center px-3 py-1">
        <View className={`mb-1 flex-row items-center justify-start gap-2 ${bgColorOr(item.category_color)}`}>
          <View className="size-8.5 items-center justify-center rounded-lg" style={{ backgroundColor: hexWithOpacity(item.category_color, 15) }}>
            <Text className="text-xl">{emoji}</Text>
          </View>
          <Text className="w-full text-sm text-muted-foreground" numberOfLines={1}>
            {item.category_name}
          </Text>
        </View>
        {item.total !== undefined && (
          <FormattedCurrency value={item.total} currency={currency} className="font-medium" numberOfLines={1} />
        )}
        {showBudget && periodSelection.mode !== 'all' && (
          <BudgetProgressBar
            spent={item.expense_total}
            budget={scaledBudget ?? 0}
            monthlyBudget={!isMonthView ? monthlyBudget : undefined}
            currency={currency}
            className="mt-0.5"
          />
        )}
      </Pressable>
    </View>
  );
}
