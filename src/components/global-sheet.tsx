import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { SheetConfig, SheetType } from '@/lib/sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef } from 'react';
import { Modal } from '@/components/ui';
import { AccountForm } from '@/features/accounts/components/account-form';
import { CategoryForm } from '@/features/categories/category-form';
import { ScheduledTransactionForm } from '@/features/scheduled-transactions/components/scheduled-transaction-form';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { translate } from '@/lib/i18n';
import { SHEET_SNAP_POINTS } from '@/lib/sheet';
import { closeSheet, useLocalStore } from '../lib/local-store';

const SHEET_TITLES: Record<SheetType, string> = {
  'add-transaction': translate('transactions.add'),
  'add-account': translate('accounts.add'),
  'edit-account': translate('accounts.edit'),
  'add-category': translate('categories.add'),
  'edit-category': translate('categories.edit'),
  'add-scheduled': translate('scheduled.add'),
};

function SheetContent({ config, onClose }: { config: SheetConfig; onClose: () => void }) {
  switch (config.type) {
    case 'add-transaction':
      return (
        <TransactionForm
          initialValues={config.categoryId ? { category_id: config.categoryId } : undefined}
          onSuccess={onClose}
          onCancel={onClose}
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
          initialValues={{
            id: config.categoryId,
            name: config.name,
            color: config.color,
            icon: config.icon,
          }}
          onSuccess={onClose}
          onCancel={onClose}
        />
      );
    case 'add-scheduled':
      return <ScheduledTransactionForm onSuccess={onClose} onCancel={onClose} />;
    default:
      return null;
  }
}

export function GlobalSheet() {
  const config = useLocalStore.use.sheet();
  const modalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(
    () => (config ? SHEET_SNAP_POINTS[config.type] : ['82%']),
    [config],
  );

  useEffect(() => {
    if (config) {
      modalRef.current?.present();
    }
    else {
      modalRef.current?.dismiss();
    }
  }, [config]);

  return (
    <Modal
      ref={modalRef}
      snapPoints={snapPoints}
      title={config ? SHEET_TITLES[config.type] : undefined}
      onDismiss={closeSheet}
    >
      {() => (
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {config && <SheetContent config={config} onClose={closeSheet} />}
        </BottomSheetScrollView>
      )}
    </Modal>
  );
}
