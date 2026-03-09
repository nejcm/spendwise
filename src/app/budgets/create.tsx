import { Stack } from 'expo-router';
import * as React from 'react';

import { BudgetCreateScreen } from '@/features/budgets/budget-create-screen';
import { translate } from '@/lib/i18n';

export default function BudgetCreateRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('budgets.create') }} />
      <BudgetCreateScreen />
    </>
  );
}
