import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileWarning } from 'lucide-react-native';
import * as React from 'react';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { OutlineButton } from '@/components/ui/outline-button';
import { useCategorySpendByRange } from '@/features/insights/api';
import { useUpdateCategoryOrder } from '@/features/transactions/api';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { setPeriodSelection, useAppStore } from '@/lib/store';
import { CategoryGrid } from './category-grid';

export function CategoriesScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === 'true' || edit === '1';

  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = React.useMemo(() => getPeriodRange(selection), [selection]);

  const { data } = useCategorySpendByRange(startDate, endDate);
  const updateOrder = useUpdateCategoryOrder();

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      {isEditMode
        ? (
            <View className="flex-row items-center justify-center gap-2 py-2">
              <FileWarning className="size-4 text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">
                {translate('categories.edit_mode')}
              </Text>
              <OutlineButton
                label={translate('common.exit')}
                color="secondary"
                onPress={() => router.replace('/categories')}
                size="xs"
                className="rounded-full px-5"
              />
            </View>
          )
        : (
            <PeriodSelector selection={selection} onSelect={setPeriodSelection} />
          )}
      <CategoryGrid
        categories={data || []}
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
              name: category.category_name,
              color: category.category_color,
              icon: category.category_icon || null,
            });
            return;
          }
          openSheet({ type: 'add-transaction', categoryId: category.category_id });
        }}
      />
    </View>
  );
}
