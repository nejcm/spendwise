import { Stack } from 'expo-router';
import * as React from 'react';

import { GoalListScreen } from '@/features/goals/goal-list-screen';
import { translate } from '@/lib/i18n';

export default function GoalsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('goals.title') }} />
      <GoalListScreen />
    </>
  );
}
