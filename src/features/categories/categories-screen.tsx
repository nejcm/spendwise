import type { CategoryManageModalProps } from '@/components/category-manage-modal';
import type { MonthPickerRef } from '@/features/transactions/components/month-picker';
import { format } from 'date-fns';

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react-native';
import * as React from 'react';
import { CategoryManageModal } from '@/components/category-manage-modal';
import { CategoryGrid, FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';
import { formatMonthYear } from '@/features/formatting/helpers';
import { useCategorySpend } from '@/features/insights/api';
import { useUpdateCategoryOrder } from '@/features/transactions/api';
import { MonthPicker } from '@/features/transactions/components/month-picker';

export function CategoriesScreen() {
  const [modelProps, setModelProps] = React.useState<CategoryManageModalProps['initialValues'] | undefined>();
  const [currentMonth, setCurrentMonth] = React.useState(() => format(new Date(), 'yyyy-MM'));
  const monthPickerRef = React.useRef<MonthPickerRef>(null);
  const { data } = useCategorySpend(currentMonth);
  const updateOrder = useUpdateCategoryOrder();

  const navigateMonth = React.useCallback(
    (direction: -1 | 1) => {
      const [year, month] = currentMonth.split('-').map(Number);
      const date = new Date(year, month - 1 + direction, 1);
      setCurrentMonth(format(date, 'yyyy-MM'));
    },
    [currentMonth],
  );

  const monthLabel = React.useMemo(() => formatMonthYear(`${currentMonth}-01`), [currentMonth]);

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-row items-center justify-between p-4">
        <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
          <ArrowLeftIcon className="size-5 text-neutral-500" />
        </Pressable>
        <Pressable
          onPress={() => monthPickerRef.current?.present()}
          hitSlop={12}
          className="min-w-[120px] items-center"
        >
          <Text className="text-lg font-medium">{monthLabel}</Text>
        </Pressable>
        <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
          <ArrowRightIcon className="size-5 text-neutral-500" />
        </Pressable>
      </View>
      <MonthPicker ref={monthPickerRef} selectedMonth={currentMonth} onSelect={setCurrentMonth} />
      <CategoryGrid
        categories={data || []}
        onReorder={(items) => updateOrder.mutate(items)}
        onAddPress={() => setModelProps({ id: undefined })}
        onPress={(category) => setModelProps(category
          ? {
              id: category.category_id,
              name: category.category_name,
              type: category.category_type,
              color: category.category_color,
              sort_order: category.sort_order,
            }
          : undefined)}
      />
      <CategoryManageModal isOpen={!!modelProps} onClose={() => setModelProps(undefined)} initialValues={modelProps} />
    </View>
  );
}
