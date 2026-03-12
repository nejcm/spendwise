import { Stack } from 'expo-router';
import * as React from 'react';

import { AccountListScreen } from '@/features/accounts/account-list-screen';
import { translate } from '@/lib/i18n';

export default function AccountsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('settings.accounts') }} />
      <AccountListScreen />
    </>
  );
}
