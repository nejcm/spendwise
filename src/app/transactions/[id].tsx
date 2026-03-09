import { Stack } from 'expo-router';
import * as React from 'react';

import { TransactionDetailScreen } from '@/features/transactions/transaction-detail-screen';

export default function TransactionDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Transaction' }} />
      <TransactionDetailScreen />
    </>
  );
}
