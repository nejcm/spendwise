import { Stack } from 'expo-router';
import * as React from 'react';

import { TransferScreen } from '@/features/accounts/transfer-screen';
import { translate } from '@/lib/i18n';

export default function TransferRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('accounts.transfer') }} />
      <TransferScreen />
    </>
  );
}
