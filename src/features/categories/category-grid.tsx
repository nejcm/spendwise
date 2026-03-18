import type { CurrencyKey } from '../currencies';
import type { CategorySpend } from '@/features/insights/types';
import { Lightbulb } from 'lucide-react-native';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { NoDataCard } from '../../components/no-data-card';
import { formatCurrency } from '../formatting/helpers';

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
                  <CategoryGridCell
                    item={item}
                    currency={currency}
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
  onPress: (category: CategorySpend) => void;
};

function CategoryGridCell({ item, currency, onPress }: CategoryGridCellProps) {
  const emoji = item.category_icon && item.category_icon.trim() ? item.category_icon : item.category_name.charAt(0).toUpperCase();

  return (
    <Pressable onPress={() => onPress(item)} className="rounded-xl bg-card p-3">
      <View
        className="mb-1 flex-row items-center justify-start gap-2"
      >
        <Text className="text-xl">{emoji}</Text>
        <Text className="w-full text-sm text-muted-foreground" numberOfLines={1}>
          {item.category_name}
        </Text>
      </View>
      {item.total !== undefined && (
        <Text className="font-medium" numberOfLines={1}>
          {formatCurrency(item.total, currency)}
        </Text>
      )}
    </Pressable>
  );
}
