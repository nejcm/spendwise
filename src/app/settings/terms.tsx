import { Stack } from 'expo-router';
import * as React from 'react';

import { TermsScreen } from '@/features/settings/terms-screen';
import { translate } from '@/lib/i18n';

export default function TermsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('settings.terms') }} />
      <TermsScreen />
    </>
  );
}
