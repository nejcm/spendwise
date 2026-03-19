import * as React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { useAppStore } from '@/lib/store';
import { FormattedCurrency } from './formatted-text';

import { Text } from './text';

type Props = {
  spent: number; // cents
  budget: number; // cents
  className?: string;
};

export function BudgetProgressBar({ spent, budget, className }: Props) {
  const currency = useAppStore.use.currency();
  const ratio = budget > 0 ? spent / budget : 0;
  const percentage = Math.min(ratio * 100, 100);
  const isOver = ratio >= 1;

  return (
    <View className={twMerge('gap-1', className)}>
      <View className="h-1.5 overflow-hidden rounded-full bg-muted">
        <View
          className={twMerge(
            'h-full rounded-full',
            isOver ? 'bg-danger-500' : 'bg-foreground',
          )}
          style={{ width: `${percentage}%` }}
        />
      </View>
      <Text className={twMerge('text-xs', isOver ? 'text-danger-500' : 'text-muted-foreground')}>
        <FormattedCurrency value={spent} currency={currency} className="text-xs" />
        {' / '}
        <FormattedCurrency value={budget} currency={currency} className="text-xs" />
      </Text>
    </View>
  );
}
