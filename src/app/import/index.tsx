import { Stack } from 'expo-router';
import * as React from 'react';

import { ImportScreen } from '@/features/imports/import-screen';
import { translate } from '@/lib/i18n';

export default function ImportRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('import.title') }} />
      <ImportScreen />
    </>
  );
}
