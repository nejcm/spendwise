import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { ScanLine, SolidButton } from '@/components/ui';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { parseTransactionFormInitialValues } from '@/features/transactions/form-route-params';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { triggerScanPicker } from '@/lib/store/local-store';
import { useAppStore } from '@/lib/store/store';

export default function NewTransactionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const openTxDetails = useAppStore.use.openTxOnCreate();
  const initialValues = React.useMemo(() => parseTransactionFormInitialValues(params), [params]);
  const onBack = () => goBackOrFallback(router);

  return (
    <>
      <ScreenHeader title={translate('transactions.add')}>
        <SolidButton
          className="ml-auto rounded-4xl px-3"
          size="2xs"
          color="default"
          accessibilityLabel={translate('scan.button_label')}
          onPress={triggerScanPicker}
          label={translate('common.scan')}
          iconRight={<ScanLine colorClassName="accent-background" className="mt-px ml-2" size={15} />}
        />
      </ScreenHeader>
      <TransactionForm
        initialValues={initialValues}
        onSuccess={(transactionId) => {
          if (openTxDetails && transactionId) {
            router.replace(`/transactions/${transactionId}`);
            return;
          }
          onBack();
        }}
        onCancel={onBack}
      />
    </>
  );
}
