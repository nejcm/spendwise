import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { CategoryManageModalProps } from '@/features/categories/category-manage-modal';
import type { TransactionFormProps } from '@/features/transactions/components/transaction-form';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftIcon, ArrowRightIcon, FileWarning } from 'lucide-react-native';
import * as React from 'react';
import { MonthPicker, YearPicker } from '@/components/month-year-picker';
import { FocusAwareStatusBar, Modal, Pressable, Text, useModal, View } from '@/components/ui';
import { CategoryManageModal } from '@/features/categories/category-manage-modal';
import { useCategorySpend } from '@/features/insights/api';
import { useUpdateCategoryOrder } from '@/features/transactions/api';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { translate } from '@/lib/i18n';
import { OutlineButton } from '../../components/ui/outline-button';
import { CategoryGrid } from './category-grid';

export function CategoriesScreen() {
  const [categoryModal, setCategoryModal] = React.useState<CategoryManageModalProps['initialValues'] | undefined>();
  const { ref: transactionSheetRef } = useModal();
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === 'true' || edit === '1';
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

  const closeTransactionSheet = () => {
    transactionSheetRef.current?.dismiss();
  };

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
            <View className="flex-row items-center justify-between p-4">
              <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
                <ArrowLeftIcon className="size-5 text-muted-foreground" />
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
                <ArrowRightIcon className="size-5 text-muted-foreground" />
              </Pressable>
            </View>
          )}
      <CategoryGrid
        categories={data || []}
        onReorder={(items) => updateOrder.mutate(items)}
        onAddPress={() => setCategoryModal({ id: undefined })}
        onPress={(category) => {
          if (!category) {
            setCategoryModal({ id: undefined });
            return;
          }
          if (isEditMode) {
            setCategoryModal({
              id: category.category_id,
              name: category.category_name,
              color: category.category_color,
              icon: category.category_icon || null,
            });
            return;
          }
          transactionSheetRef.current?.present({
            category_id: category.category_id,
          } satisfies TransactionFormProps['initialValues']);
        }}
      />
      <CategoryManageModal isOpen={!!categoryModal} onClose={() => setCategoryModal(undefined)} initialValues={categoryModal} />
      <Modal ref={transactionSheetRef} snapPoints={['85%']} onDismiss={closeTransactionSheet} title={translate('transactions.add')}>
        {(data) => (
          <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            <TransactionForm
              initialValues={data?.data}
              onSuccess={closeTransactionSheet}
              onCancel={closeTransactionSheet}
            />
          </BottomSheetScrollView>
        )}
      </Modal>
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
