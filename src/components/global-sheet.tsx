import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { SheetConfig, SheetType } from '@/lib/sheet';
import { useEffect, useMemo, useRef } from 'react';
import { BackHandler } from 'react-native';
import { ModalSheet, Text, View } from '@/components/ui';
import { AccountForm } from '@/features/accounts/components/account-form';
import { CategoryForm } from '@/features/categories/category-form';
import { ScheduledTransactionForm } from '@/features/scheduled-transactions/components/scheduled-transaction-form';
import { ScanFab } from '@/features/transactions/components/scan-fab';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { translate } from '@/lib/i18n';
import { SHEET_SNAP_POINTS } from '@/lib/sheet';
import { closeSheet, useLocalStore } from '@/lib/store/local-store';
import { IS_WEB } from '../lib/base';

const SHEET_DATA: Record<SheetType, { title: string; content?: React.ReactNode }> = {
  'add-transaction': { title: translate('transactions.add'), content: <ScanFab /> },
  'add-account': { title: translate('accounts.add') },
  'edit-account': { title: translate('accounts.edit') },
  'add-category': { title: translate('categories.add') },
  'edit-category': { title: translate('categories.edit') },
  'add-scheduled': { title: translate('scheduled.add') },
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
      <Text className="text-lg font-bold">{SHEET_DATA[config.type].title}</Text>
      {/* {actions} */}
      {SHEET_DATA[config.type].content || null}
    </View>
  );
}

function SheetContent({ config, onClose }: { config: SheetConfig; onClose: () => void }) {
  switch (config.type) {
    case 'add-transaction':
      return (
        <TransactionForm
          initialValues={config.initialValues}
          onSuccess={onClose}
          onCancel={onClose}
          isSheet
        />
      );
    case 'add-account':
      return <AccountForm onSuccess={onClose} onCancel={onClose} isSheet />;
    case 'edit-account':
      return (
        <AccountForm
          key={config.accountId}
          accountId={config.accountId}
          initialData={config.initialData}
          onSuccess={onClose}
          onDeleteSuccess={onClose}
          onCancel={onClose}
          isSheet
        />
      );
    case 'add-category':
      return (
        <CategoryForm
          initialValues={{ id: undefined }}
          onSuccess={onClose}
          onCancel={onClose}
          isSheet
        />
      );
    case 'edit-category':
      return (
        <CategoryForm
          initialValues={config.initialValues}
          onSuccess={onClose}
          onCancel={onClose}
          isSheet
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

  const isOpen = config !== undefined;

  useEffect(() => {
    if (IS_WEB) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isOpen) return false;
      closeSheet();
      return true;
    });

    return () => sub.remove();
  }, [isOpen]);

  return (
    <ModalSheet
      ref={modalRef}
      onDismiss={closeSheet}
      title={<SheetTitle config={config} />}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableDynamicSizing
      {...config?.props}
      android_keyboardInputMode="adjustPan"
    >

      {config && <SheetContent config={config} onClose={closeSheet} />}
    </ModalSheet>
  );
}
