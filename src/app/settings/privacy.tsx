import { Stack } from 'expo-router';
import * as React from 'react';

import { PrivacyScreen } from '@/features/settings/privacy-screen';
import { translate } from '@/lib/i18n';

export default function PrivacyRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('settings.privacy') }} />
      <PrivacyScreen />
    </>
  );
}
