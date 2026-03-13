import { Stack } from 'expo-router';
import * as React from 'react';

import { AccountsScreen } from '@/features/accounts/accounts-screen';
import { translate } from '@/lib/i18n';

export default function AccountsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('settings.accounts') }} />
      <AccountsScreen />
    </>
  );
}
