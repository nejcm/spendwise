import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { Pressable } from 'react-native';
import { PeriodSelector } from '@/components/period-selector';
import { PeriodSwipeContainer } from '@/components/period-swipe-container';
import { FocusAwareStatusBar, FormattedCurrency, Text, View } from '@/components/ui';
import { FileWarning, Pencil, PencilOff } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { SkeletonGrid } from '@/components/ui/skeleton';
import { useUpdateCategoryOrder } from '@/features/categories/api';
import { centsToAmount } from '@/features/formatting/helpers';
import { categorySpendByRangeQueryOptions, useCategorySpendByRange } from '@/features/insights/api';
import { usePrefetchAdjacentPeriods } from '@/lib/data/prefetch';
import { getPeriodRange } from '@/lib/date/helpers';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { useAppStore } from '@/lib/store';
import { CategoryGrid } from './category-grid';

export function CategoriesScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === 'true' || edit === '1';

  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = React.useMemo(() => getPeriodRange(selection), [selection]);

  const { data = [], isLoading } = useCategorySpendByRange(startDate, endDate);
  const updateOrder = useUpdateCategoryOrder();
  const { onRefresh } = useRefresh();

  const db = useSQLiteContext();
  usePrefetchAdjacentPeriods(selection, (start, end) => categorySpendByRangeQueryOptions(db, start, end));
  const total = React.useMemo(
    () => data.reduce((sum, c) => sum + c.income_total - c.expense_total, 0),
    [data],
  );

  const EditIcon = isEditMode ? PencilOff : Pencil;

  return (
    <PeriodSwipeContainer selection={selection}>
      <FocusAwareStatusBar />
      <View className="flex-row items-center justify-between px-4 pt-2">
        <View className="w-8"></View>
        <Pressable
          onPress={() => router.navigate('/stats')}
          className="items-center justify-center"
          hitSlop={10}
        >
          <FormattedCurrency value={total} currency={currency} className="text-xl font-medium" />
        </Pressable>
        <IconButton
          size="sm"
          color="none"
          onPress={() => router.navigate({ pathname: '/categories', params: isEditMode ? undefined : { edit: 'true' } })}
        >
          <EditIcon className="text-muted-foreground" size={16} />
        </IconButton>
      </View>
      {isEditMode
        ? (
            <View className="flex-row items-center justify-center gap-2 py-3.5">
              <FileWarning className="text-warning-500" size={16} />
              <Text className="text-sm text-warning-500">
                {translate('categories.edit_mode')}
              </Text>
            </View>
          )
        : (
            <PeriodSelector
              selection={selection}
              className="pt-2"
            />
          )}
      {isLoading
        ? (
            <SkeletonGrid className="px-4 pt-2" cols={2} rows={3} />
          )
        : (
            <CategoryGrid
              categories={data}
              editMode={isEditMode}
              onRefresh={onRefresh}
              onReorder={(items) => updateOrder.mutate(items)}
              onAddPress={() => openSheet({ type: 'add-category' })}
              onPress={(category) => {
                if (!category) {
                  openSheet({ type: 'add-category' });
                  return;
                }
                if (isEditMode) {
                  openSheet({
                    type: 'edit-category',
                    categoryId: category.category_id,
                    initialValues: {
                      id: category.category_id,
                      name: category.category_name,
                      color: category.category_color,
                      icon: category.category_icon || null,
                      budget: category.category_budget ? String(centsToAmount(category.category_budget)) : null,
                    },
                  });
                  return;
                }
                openSheet({ type: 'add-transaction', initialValues: { category_id: category.category_id } });
              }}
            />
          )}
    </PeriodSwipeContainer>
  );
}
