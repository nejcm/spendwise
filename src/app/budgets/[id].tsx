import { Stack } from 'expo-router';
import * as React from 'react';

import { BudgetDetailScreen } from '@/features/budgets/budget-detail-screen';
import { translate } from '@/lib/i18n';

export default function BudgetDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('budgets.detail') }} />
      <BudgetDetailScreen />
    </>
  );
}
