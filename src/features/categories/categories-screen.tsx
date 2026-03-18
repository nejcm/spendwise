import type { CategoryManageModalProps } from '@/features/categories/category-manage-modal';
import type { TransactionFormProps } from '@/features/transactions/components/transaction-form';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileWarning } from 'lucide-react-native';
import * as React from 'react';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, Modal, Text, useModal, View } from '@/components/ui';
import { OutlineButton } from '@/components/ui/outline-button';
import { CategoryManageModal } from '@/features/categories/category-manage-modal';
import { useCategorySpendByRange } from '@/features/insights/api';
import { useUpdateCategoryOrder } from '@/features/transactions/api';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { setPeriodSelection, useAppStore } from '@/lib/store';
import { CategoryGrid } from './category-grid';

export function CategoriesScreen() {
  const [categoryModal, setCategoryModal] = React.useState<CategoryManageModalProps['initialValues'] | undefined>();
  const { ref: transactionSheetRef } = useModal();
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === 'true' || edit === '1';

  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = React.useMemo(() => getPeriodRange(selection), [selection]);

  const { data } = useCategorySpendByRange(startDate, endDate);
  const updateOrder = useUpdateCategoryOrder();

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
            <PeriodSelector selection={selection} onSelect={setPeriodSelection} />
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
    </View>
  );
}
