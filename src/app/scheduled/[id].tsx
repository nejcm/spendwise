import { Stack } from 'expo-router';
import * as React from 'react';
import { ScheduledTransactionDetailScreen } from '@/features/scheduled-transactions/scheduled-transaction-detail-screen';
import { translate } from '@/lib/i18n';

export default function ScheduledTransactionDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('scheduled.title') }} />
      <ScheduledTransactionDetailScreen />
    </>
  );
}
