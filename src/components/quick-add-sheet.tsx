import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';

import { Modal, Text } from '@/components/ui';
import { AccountForm } from '@/features/accounts/components/account-form';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { translate } from '@/lib/i18n';
import { CategoryForm } from '../features/categories/category-form';

export type QuickAddSheetData = {
  pathname?: string;
};
export type QuickAddSheetProps = {
  sheetRef: React.RefObject<BottomSheetModal<QuickAddSheetData> | null>;
  pathname: string;
};

function renderContent(pathname: string, sheetRef: React.RefObject<BottomSheetModal<QuickAddSheetData> | null>) {
  const onSuccess = () => sheetRef.current?.dismiss();
  if (pathname.startsWith('/accounts')) {
    return (
      <>
        <Text className="mb-4 text-center text-2xl font-bold">
          {translate('accounts.add')}
        </Text>
        <AccountForm onSuccess={onSuccess} />
      </>
    );
  }

  if (pathname.startsWith('/categories')) {
    return (
      <>
        <Text className="mb-4 text-center text-2xl font-bold">
          {translate('categories.add')}
        </Text>
        <CategoryForm onSuccess={onSuccess} />
      </>
    );
  }

  return (
    <>
      <Text className="mb-4 text-center text-2xl font-bold">
        {translate('transactions.add')}
      </Text>
      <TransactionForm onSuccess={onSuccess} />
    </>
  );
};

export function QuickAddSheet({ sheetRef }: QuickAddSheetProps) {
  return (
    <Modal ref={sheetRef} snapPoints={['85%']}>
      {(data) => {
        return (
          <BottomSheetScrollView className="flex-1 px-4 pb-8">
            {renderContent(String(data?.data?.pathname || ''), sheetRef)}
          </BottomSheetScrollView>
        );
      }}
    </Modal>
  );
}
