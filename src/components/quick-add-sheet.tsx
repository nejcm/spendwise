import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';

import { Modal, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { TransactionForm } from '../features/transactions/components/transaction-form';

export type QuickAddSheetProps = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  pathname: string;
};

function renderContent(pathname: string) {
  if (pathname === '/' || pathname.startsWith('/transactions')) {
    return <TransactionForm />;
  }

  if (pathname.startsWith('/accounts')) {
    return (
      <Text>
        Accounts
      </Text>
    );
  }

  if (pathname.startsWith('/categories')) {
    return (
      <Text>
        Categories
      </Text>
    );
  }

  return <TransactionForm />;
};

export function QuickAddSheet({ sheetRef, pathname }: QuickAddSheetProps) {
  return (
    <Modal ref={sheetRef} title={translate('transactions.add')} snapPoints={['85%']}>
      <BottomSheetScrollView className="flex-1 px-4 pb-8">
        {renderContent(pathname)}
      </BottomSheetScrollView>
    </Modal>
  );
}
