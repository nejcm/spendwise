import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { IconButton, ScanLine } from '@/components/ui';
import { TransactionFormModal } from '@/features/transactions/components/transaction-form';
import { parseTransactionFormInitialValues } from '@/features/transactions/form-route-params';
import { translate } from '@/lib/i18n';
import { triggerScanPicker } from '@/lib/store/local-store';
import { useAppStore } from '@/lib/store/store';

export default function NewTransactionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const openTxDetails = useAppStore.use.openTxOnCreate();
  const initialValues = React.useMemo(() => parseTransactionFormInitialValues(params), [params]);
  const onBack = () => router.back();

  return (
    <>
      <ScreenHeader title={translate('transactions.add')}>
        <IconButton
          className="ml-auto"
          size="sm"
          color="secondary"
          accessibilityLabel={translate('scan.button_label')}
          onPress={triggerScanPicker}
        >
          <ScanLine className="text-foreground" size={16} />
        </IconButton>
      </ScreenHeader>
      <TransactionFormModal
        initialValues={initialValues}
        onSuccess={(transactionId) => {
          if (openTxDetails && transactionId) {
            router.replace(`/transactions/${transactionId}`);
            return;
          }
          router.back();
        }}
        onCancel={onBack}
      />
    </>
  );
}
