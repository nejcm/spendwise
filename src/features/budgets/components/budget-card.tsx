import type { BudgetWithProgress } from '../types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

import { BudgetProgressBar } from './budget-progress-bar';

type Props = {
  budget: BudgetWithProgress;
  onPress?: () => void;
};

export function BudgetCard({ budget, onPress }: Props) {
  const currency = useAppStore.use.currency();
  const remaining = budget.amount - budget.total_spent;
  const isOver = remaining < 0;

  return (
    <Pressable onPress={onPress} className="mb-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold">{budget.name}</Text>
        <Text className={`text-sm font-medium ${isOver ? 'text-danger-500' : 'text-success-600'}`}>
          {isOver
            ? translate('budgets.over_budget')
            : `${formatCurrency(remaining, currency)} ${translate('budgets.left')}`}
        </Text>
      </View>

      <BudgetProgressBar spent={budget.total_spent} total={budget.amount} />

      <View className="mt-2 flex-row justify-between">
        <Text className="text-xs text-neutral-500">
          {formatCurrency(budget.total_spent, currency)}
          {' '}
          {translate('budgets.spent')}
        </Text>
        <Text className="text-xs text-neutral-500">
          {formatCurrency(budget.amount, currency)}
          {' '}
          {translate('budgets.budgeted')}
        </Text>
      </View>
    </Pressable>
  );
}
