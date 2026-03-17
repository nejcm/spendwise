import { Stack } from 'expo-router';
import * as React from 'react';
import { ScheduledTransactionsScreen } from '@/features/scheduled-transactions/scheduled-transactions-screen';
import { translate } from '@/lib/i18n';

export default function ScheduledTransactionsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('scheduled.title'), headerShown: false }} />
      <ScheduledTransactionsScreen />
    </>
  );
}
