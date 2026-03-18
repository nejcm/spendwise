import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileWarning, Pencil, PencilOff } from 'lucide-react-native';
import * as React from 'react';
import { Pressable } from 'react-native';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';
import { useCategorySpendByRange } from '@/features/insights/api';
import { useUpdateCategoryOrder } from '@/features/transactions/api';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { setPeriodSelection, useAppStore } from '@/lib/store';
import { IconButton } from '../../components/ui/icon-button';
import { CategoryGrid } from './category-grid';

export function CategoriesScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === 'true' || edit === '1';

  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = React.useMemo(() => getPeriodRange(selection), [selection]);

  const { data = [] } = useCategorySpendByRange(startDate, endDate);
  const updateOrder = useUpdateCategoryOrder();
  const total = React.useMemo(
    () => data.reduce((sum, c) => sum + c.income_total - c.expense_total, 0),
    [data],
  );

  const EditIcon = isEditMode ? PencilOff : Pencil;

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-row items-center justify-between px-4 pt-2">
        <View className="w-8"></View>
        <Pressable
          onPress={() => router.navigate('/stats')}
          className="items-center justify-center"
          hitSlop={10}
        >
          <Text className="text-xl font-medium">{formatCurrency(total, currency)}</Text>
        </Pressable>
        <IconButton
          size="sm"
          color="none"
          onPress={() => router.navigate({ pathname: '/categories', params: isEditMode ? undefined : { edit: 'true' } })}
        >
          <EditIcon className="size-4.5 text-muted-foreground" />
        </IconButton>
      </View>
      {isEditMode
        ? (
            <View className="flex-row items-center justify-center gap-2 py-4">
              <FileWarning className="size-4 text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">
                {translate('categories.edit_mode')}
              </Text>
            </View>
          )
        : (
            <PeriodSelector
              selection={selection}
              className="pt-2"
              onSelect={(s) => {
                setPeriodSelection(s);
              }}
            />
          )}
      <CategoryGrid
        categories={data}
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
