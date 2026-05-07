import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { ScheduledTransactionFormModal } from '@/features/scheduled-transactions/components/scheduled-transaction-form';
import { parseScheduledFormInitialValues } from '@/features/transactions/form-route-params';
import { translate } from '@/lib/i18n';

export default function NewScheduledTransactionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialValues = React.useMemo(() => parseScheduledFormInitialValues(params), [params]);
  const onBack = () => router.back();

  return (
    <>
      <ScreenHeader title={translate('scheduled.add')} />
      <ScheduledTransactionFormModal
        initialValues={initialValues}
        onSuccess={onBack}
        onCancel={onBack}
      />
    </>
  );
}
