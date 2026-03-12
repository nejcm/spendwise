import type { CategorySpend } from '../features/insights/types';
import { Lightbulb, Plus } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { formatCurrency } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '../lib/store';
import { Text } from './ui/text';

export type CategoryGridProps = {
  categories: CategorySpend[];
  onReorder: (items: Array<{ id: string; sort_order: number }>, type: 'expense' | 'income') => void;
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
  const [activeTab, setActiveTab] = React.useState<'expense' | 'income'>('expense');
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const filteredItems = React.useMemo(() => categories.filter((c) => c.category_type === activeTab), [categories, activeTab]);

  function handleDragEnd(params: { data: CategorySpend[] }) {
    const updates = params.data.map((item, idx) => ({ id: item.category_id, sort_order: idx }));
    onReorder(updates, activeTab);
  }

  return (
    <Animated.ScrollView ref={scrollRef} className="flex-1 bg-background">
      <View className="flex-row gap-2 p-4">
        <Pressable
          onPress={() => setActiveTab('expense')}
          className={`flex-1 rounded-full px-4 py-1.5 ${activeTab === 'expense' ? 'bg-foreground' : 'bg-muted'}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === 'expense' ? 'text-background' : ''}`}>
            {translate('transactions.expense')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('income')}
          className={`flex-1 rounded-full px-4 py-1.5 ${activeTab === 'income' ? 'bg-foreground' : 'bg-muted'}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === 'income' ? 'text-background' : ''}`}>
            {translate('transactions.income')}
          </Text>
        </Pressable>
      </View>

      <View className="px-4 pb-4">
        {filteredItems.length === 0
          ? (
              <AddPlaceholder onPress={() => onAddPress()} />
            )
          : (
              <Sortable.Grid
                data={filteredItems}
                columns={2}
                columnGap={10}
                rowGap={10}
                hapticsEnabled
                scrollableRef={scrollRef}
                keyExtractor={(item) => item.category_id}
                renderItem={({ item }) => (
                  <CategoryGridCell
                    item={item}
                    currency={currency}
                    onPress={onPress}
                  />
                )}
                onDragEnd={handleDragEnd}
              />
            )}

        {filteredItems.length > 0 && (
          <AddPlaceholder onPress={() => onAddPress()} />
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
  currency: string;
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

function AddPlaceholder({ onPress }: { onPress: () => void }) {
  return (
    <View className="w-[50%] flex-1 pr-1">
      <Pressable
        onPress={onPress}
        className="mt-3 flex-row items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 py-5 dark:border-gray-500"
      >
        <Plus className="size-8 text-muted-foreground" />
        <Text className="text-muted-foreground">{translate('common.add')}</Text>
      </Pressable>
    </View>
  );
}
