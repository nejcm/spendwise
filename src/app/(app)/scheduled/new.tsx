import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { FocusAwareStatusBar } from '@/components/ui';
import { ScheduledTransactionForm } from '@/features/scheduled-transactions/components/scheduled-transaction-form';
import { parseScheduledFormInitialValues } from '@/features/transactions/form-route-params';
import { goBackOrFallback } from '@/lib/routing';

export default function NewScheduledTransactionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialValues = React.useMemo(() => parseScheduledFormInitialValues(params), [params]);
  const onBack = () => goBackOrFallback(router, '/scheduled');

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-wash to-background" />
      <ScheduledTransactionForm
        hasNav={false}
        initialValues={initialValues}
        onSuccess={onBack}
        onCancel={onBack}
      />
    </View>
  );
}
