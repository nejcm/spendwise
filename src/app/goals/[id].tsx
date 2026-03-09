import { Stack } from 'expo-router';
import * as React from 'react';

import { GoalDetailScreen } from '@/features/goals/goal-detail-screen';
import { translate } from '@/lib/i18n';

export default function GoalDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('goals.detail') }} />
      <GoalDetailScreen />
    </>
  );
}
