import { Stack } from 'expo-router';
import * as React from 'react';

import { InsightsScreen } from '@/features/insights/insights-screen';
import { translate } from '@/lib/i18n';

export default function InsightsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('insights.title') }} />
      <InsightsScreen />
    </>
  );
}
