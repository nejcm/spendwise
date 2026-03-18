import { Stack } from 'expo-router';
import * as React from 'react';

import { ImportScreen } from '@/features/imports-export/import-export-screen';
import { translate } from '@/lib/i18n';

export default function ImportRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('import-export.title'), headerShown: true }} />
      <ImportScreen />
    </>
  );
}
