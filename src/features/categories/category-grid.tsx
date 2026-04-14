import type { CategorySpend } from '@/features/insights/types';
import * as React from 'react';
import { useState } from 'react';
import { RefreshControl } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

import Sortable from 'react-native-sortables';
import { NoDataCard } from '@/components/no-data-card';
import { Alert, Text, View } from '@/components/ui';
import { Lightbulb } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import CategoryCard from './category-card';
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
