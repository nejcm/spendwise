import { Stack } from 'expo-router';
import * as React from 'react';

import { SecuritySettingsScreen } from '@/features/security/security-settings-screen';
import { translate } from '@/lib/i18n';

export default function SecurityRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('security.title'), headerShown: true }} />
      <SecuritySettingsScreen />
    </>
  );
}
