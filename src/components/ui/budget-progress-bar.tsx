import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { formatCurrency } from '@/features/formatting/helpers';
import { useAppStore } from '@/lib/store';
import { Text } from './text';

export type BudgetProgressBarProps = {
  spent: number; // cents (for the current period)
  budget: number; // cents (scaled to current period)
  monthlyBudget?: number; // cents (raw monthly amount — shows /mo hint when period ≠ month)
  currency?: CurrencyKey; // required when monthlyBudget is set
  className?: string;
  showValues?: boolean;
};

export function BudgetProgressBar({ spent, budget, monthlyBudget, currency, className, showValues = true }: BudgetProgressBarProps) {
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();

  const ratio = budget > 0 ? spent / budget : 0;
  const percentage = Math.min(ratio * 100, 100);
  const isOver = ratio >= 1;
  const isDanger = ratio >= 0.8;
  const monthlyHint = showValues && monthlyBudget != null && currency != null
    ? ` (${formatCurrency(monthlyBudget, currency, numberFormat, currencyFormat)}/m)`
    : '';

  return (
    <View className={twMerge('flex-row items-center gap-1', className)}>
      <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <View
          className={twMerge(
            'h-full rounded-full',
            isOver ? 'bg-danger-500' : isDanger ? 'bg-warning-500' : 'bg-foreground',
          )}
          style={{ width: `${percentage}%` }}
        />
      </View>
      {showValues && (
        <Text className="text-xs/tight text-muted-foreground">
          {percentage.toFixed(0)}
          %
          {monthlyHint}
        </Text>
      )}
    </View>
  );
}
