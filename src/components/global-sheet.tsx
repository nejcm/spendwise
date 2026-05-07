import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { SheetConfig, SheetType } from '@/lib/sheet';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { BackHandler } from 'react-native';
import { ModalSheet, Text, View } from '@/components/ui';
import { AccountFormSheet } from '@/features/accounts/components/account-form';
import { CategoryFormSheet } from '@/features/categories/category-form';
import { ScheduledTransactionFormSheet } from '@/features/scheduled-transactions/components/scheduled-transaction-form';
import { GlobalBudgetForm } from '@/features/stats/components/global-budget-form';
import { ScanFab } from '@/features/transactions/components/scan-fab';
import { TransactionFormSheet } from '@/features/transactions/components/transaction-form';
import { translate } from '@/lib/i18n';
import { SHEET_SNAP_POINTS } from '@/lib/sheet';
import { closeSheet, useLocalStore } from '@/lib/store/local-store';
import { useAppStore } from '@/lib/store/store';
import { IS_WEB } from '../lib/base';

const SHEET_DATA: Record<SheetType, { title: string; content?: React.ReactNode }> = {
  'add-transaction': { title: translate('transactions.add'), content: <ScanFab /> },
  'add-account': { title: translate('accounts.add') },
  'edit-account': { title: translate('accounts.edit') },
  'add-category': { title: translate('categories.add') },
  'edit-category': { title: translate('categories.edit') },
  'add-scheduled': { title: translate('scheduled.add') },
  'set-global-budget': { title: translate('stats.global_budget_label') },
};

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

export function GlobalSheet() {
  const router = useRouter();
  const config = useLocalStore.use.sheet();
  const openTxDetails = useAppStore.use.openTxOnCreate();
  const modalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(
    () => (config ? SHEET_SNAP_POINTS[config.type] : ['72%']),
    [config],
  );

  useEffect(() => {
    if (!modalRef.current) return;
    if (config) {
      modalRef.current.present();
      return;
    }
    modalRef.current.close();
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

  let children = null;
  switch (config?.type) {
    case 'add-transaction':
      children = (
        <TransactionFormSheet
          initialValues={config.initialValues}
          onSuccess={(transactionId) => {
            closeSheet();
            if (openTxDetails && transactionId) {
              router.push(`/transactions/${transactionId}`);
            }
          }}
          onCancel={closeSheet}
        />
      );
      break;
    case 'add-account':
      children = (
        <AccountFormSheet
          onSuccess={closeSheet}
          onCancel={closeSheet}
        />
      );
      break;
    case 'edit-account':
      children = (
        <AccountFormSheet
          accountId={config.accountId}
          initialData={config.initialData}
          onSuccess={closeSheet}
          onDeleteSuccess={closeSheet}
          onCancel={closeSheet}
        />
      );
      break;
    case 'add-category':
      children = (
        <CategoryFormSheet
          initialValues={{ id: undefined }}
          onSuccess={closeSheet}
          onCancel={closeSheet}
        />
      );
      break;
    case 'edit-category':
      children = (
        <CategoryFormSheet
          initialValues={config.initialValues}
          onSuccess={closeSheet}
          onCancel={closeSheet}
        />
      );
      break;
    case 'add-scheduled':
      children = (
        <ScheduledTransactionFormSheet
          initialValues={config.initialValues}
          onSuccess={closeSheet}
          onCancel={closeSheet}
        />
      );
      break;
    case 'set-global-budget':
      children = (
        <GlobalBudgetForm
          currentBudget={config.currentBudget}
          onSuccess={closeSheet}
          onCancel={closeSheet}
        />
      );
      break;
    default:
      children = null;
      break;
  }

  return (
    <ModalSheet
      ref={modalRef}
      onDismiss={closeSheet}
      title={<SheetTitle config={config} />}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableDynamicSizing={true}
      android_keyboardInputMode="adjustResize"
      {...config?.props}
    >
      {children}
    </ModalSheet>
  );
}
