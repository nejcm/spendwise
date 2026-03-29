import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { SheetConfig, SheetType } from '@/lib/sheet';
import { useEffect, useMemo, useRef } from 'react';
import { Modal, Text, View } from '@/components/ui';
import BottomSheetKeyboardAwareScrollView from '@/components/ui/modal-keyboard-aware-scroll-view';
import { AccountForm } from '@/features/accounts/components/account-form';
import { CategoryForm } from '@/features/categories/category-form';
import { ScheduledTransactionForm } from '@/features/scheduled-transactions/components/scheduled-transaction-form';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { translate } from '@/lib/i18n';
import { closeSheet, useLocalStore } from '@/lib/local-store';
import { SHEET_SNAP_POINTS } from '@/lib/sheet';

const SHEET_TITLES: Record<SheetType, string> = {
  'add-transaction': translate('transactions.add'),
  'add-account': translate('accounts.add'),
  'edit-account': translate('accounts.edit'),
  'add-category': translate('categories.add'),
  'edit-category': translate('categories.edit'),
  'add-scheduled': translate('scheduled.add'),
};

/* function DeleteAccountAction({ id, name }: { id: string; name: string }) {
  const archiveAccount = useArchiveAccount();

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      translate('common.delete'),
      translate('accounts.delete_confirm', { name: name ?? '' }),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await archiveAccount.mutateAsync(id);
            closeSheet();
          },
        },
      ],
    );
  }, [id, archiveAccount, name]);
  return (
    <OutlineButton
      label={translate('common.delete')}
      color="danger"
      loading={archiveAccount.isPending}
      onPress={handleDelete}
      className="rounded-full px-3"
      iconLeft={<TrashIcon colorClassName="accent-red-700" className="mr-1" size={14} />}
      size="xs"
    />
  );
}

function DeleteCategoryAction({ id, name }: { id: string; name: string }) {
  const deleteCategory = useDeleteCategory(() => closeSheet());
  const onDeletePress = (categoryId: string, name: string) => {
    Alert.alert(translate('common.delete'), translate('categories.delete_confirm', { name }), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(categoryId) },
    ]);
  };
  return (
    <OutlineButton
      label={translate('common.delete')}
      color="danger"
      loading={deleteCategory.isPending}
      onPress={() => onDeletePress(id, name)}
      className="rounded-full px-3"
      iconLeft={<TrashIcon colorClassName="accent-red-700" className="mr-1" />}
      size="xs"
    />
  );
} */

function SheetTitle({ config }: { config: SheetConfig | undefined }) {
  if (!config) return null;

  /* let actions: React.ReactNode = null;
  switch (config.type) {
    case 'edit-account':
      actions = <DeleteAccountAction id={config.accountId} name={config.initialData?.name ?? ''} />;
      break;
    case 'edit-category':
      actions = <DeleteCategoryAction id={config.categoryId} name={config.initialValues?.name ?? ''} />;
      break;
  } */
  return (
    <View className="flex-row items-center justify-center gap-3">
      <Text className="text-lg font-bold">{SHEET_TITLES[config.type]}</Text>
      {/* {actions} */}
    </View>
  );
}

function SheetContent({ config, onClose }: { config: SheetConfig; onClose: () => void }) {
  switch (config.type) {
    case 'add-transaction':
      return (
        <TransactionForm
          initialValues={config.categoryId ? { category_id: config.categoryId } : undefined}
          onSuccess={onClose}
          onCancel={onClose}
          isSheet
        />
      );
    case 'add-account':
      return <AccountForm onSuccess={onClose} onCancel={onClose} />;
    case 'edit-account':
      return (
        <AccountForm
          key={config.accountId}
          accountId={config.accountId}
          initialData={config.initialData}
          onSuccess={onClose}
          onDeleteSuccess={onClose}
          onCancel={onClose}
        />
      );
    case 'add-category':
      return (
        <CategoryForm
          initialValues={{ id: undefined }}
          onSuccess={onClose}
          onCancel={onClose}
        />
      );
    case 'edit-category':
      return (
        <CategoryForm
          initialValues={config.initialValues}
          onSuccess={onClose}
          onCancel={onClose}
        />
      );
    case 'add-scheduled':
      return (
        <ScheduledTransactionForm
          initialValues={config.initialValues}
          onSuccess={onClose}
          onCancel={onClose}
          isSheet
        />
      );
    default:
      return null;
  }
}

export function GlobalSheet() {
  const config = useLocalStore.use.sheet();
  const modalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(
    () => (config ? SHEET_SNAP_POINTS[config.type] : ['72%']),
    [config],
  );

  useEffect(() => {
    if (config) modalRef.current?.present();
    else modalRef.current?.dismiss();
  }, [config]);

  return (
    <Modal
      ref={modalRef}
      snapPoints={snapPoints}
      title={<SheetTitle config={config} />}
      onDismiss={closeSheet}
      android_keyboardInputMode="adjustPan"
    >
      {() => (
        <BottomSheetKeyboardAwareScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, minHeight: '100%' }}
          keyboardShouldPersistTaps="handled"
        >
          {config && <SheetContent config={config} onClose={closeSheet} />}
        </BottomSheetKeyboardAwareScrollView>
      )}
    </Modal>
  );
}
