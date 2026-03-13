import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { CategoryManageModalProps } from '@/features/categories/category-manage-modal';

import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react-native';
import * as React from 'react';
import { MonthPicker, YearPicker } from '@/components/month-year-picker';
import { FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';
import { CategoryManageModal } from '@/features/categories/category-manage-modal';
import { useCategorySpend } from '@/features/insights/api';
import { useUpdateCategoryOrder } from '@/features/transactions/api';
import { CategoryGrid } from './category-grid';

export function CategoriesScreen() {
  const [categoryModal, setCategoryModal] = React.useState<CategoryManageModalProps['initialValues'] | undefined>();
  // [year, month]
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const date = format(new Date(), 'yyyy-MM');
    const split = date.split('-');
    return [Number(split[0]), Number(split[1])];
  });
  const monthPickerRef = React.useRef<BottomSheetModal>(null);
  const yearPickerRef = React.useRef<BottomSheetModal>(null);
  const { data } = useCategorySpend(selectedDate.join('-'));
  const updateOrder = useUpdateCategoryOrder();

  const monthName = React.useMemo(
    () => format(new Date(selectedDate[0], selectedDate[1] - 1, 1), 'MMMM'),
    [selectedDate],
  );

  const navigateMonth = (direction: -1 | 1) => {
    const date = new Date(selectedDate[0], selectedDate[1] - 1 + direction, 1);
    setSelectedDate([date.getFullYear(), date.getMonth() + 1]);
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-row items-center justify-between p-4">
        <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
          <ArrowLeftIcon className="size-5 text-gray-500" />
        </Pressable>
        <View className="flex-row items-center gap-1">
          <Pressable onPress={() => monthPickerRef.current?.present()} hitSlop={12}>
            <Text className="text-lg font-medium">{monthName}</Text>
          </Pressable>
          <Pressable onPress={() => yearPickerRef.current?.present()} hitSlop={12}>
            <Text className="text-lg font-medium">{selectedDate[0]}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
          <ArrowRightIcon className="size-5 text-gray-500" />
        </Pressable>
      </View>
      <CategoryGrid
        categories={data || []}
        onReorder={(items) => updateOrder.mutate(items)}
        onAddPress={() => setCategoryModal({ id: undefined })}
        onPress={(category) => setCategoryModal(category
          ? {
              id: category.category_id,
              name: category.category_name,
              type: category.category_type,
              color: category.category_color,
              sort_order: category.sort_order,
            }
          : undefined)}
      />
      <CategoryManageModal isOpen={!!categoryModal} onClose={() => setCategoryModal(undefined)} initialValues={categoryModal} />
      <MonthPicker
        ref={monthPickerRef}
        selectedMonth={selectedDate[1]}
        onSelect={(month) => setSelectedDate((prev) => [prev[0], month])}
      />
      <YearPicker
        ref={yearPickerRef}
        selectedYear={selectedDate[0]}
        onSelect={(year) => setSelectedDate((prev) => [year, prev[1]])}
      />
    </View>
  );
}
