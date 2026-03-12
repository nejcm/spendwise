import { Stack } from 'expo-router';

import * as React from 'react';
import { FormattingSettingsScreen } from '@/features/settings/formatting-settings-screen';
import { translate } from '@/lib/i18n';

export default function FormattingRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('settings.formatting') }} />
      <FormattingSettingsScreen />
    </>
  );
}
