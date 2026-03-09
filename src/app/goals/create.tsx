import { Stack } from 'expo-router';
import * as React from 'react';

import { GoalCreateScreen } from '@/features/goals/goal-create-screen';
import { translate } from '@/lib/i18n';

export default function GoalCreateRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('goals.create') }} />
      <GoalCreateScreen />
    </>
  );
}
