/* eslint-disable react-refresh/only-export-components */
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { formatCurrency } from '@/features/formatting/helpers';
import { useAppStore } from '@/lib/store/store';
import { ProgressBar } from './progress-bar';

export type BudgetProgressBarProps = {
  spent: number; // cents (for the current period)
  budget: number; // cents (scaled to current period)
  monthlyBudget?: number; // cents (raw monthly amount — shows /mo hint when period ≠ month)
  currency?: CurrencyKey; // required when monthlyBudget is set
  className?: string;
  containerClassName?: string;
  showPercentage?: boolean;
  showValues?: boolean;
  bg?: string;
};

export function getColorClass(ratio: number): [string, string | undefined, string] {
  if (ratio >= 1) return ['bg-danger-600', 'bg-danger-600/20', 'text-danger-600'];
  if (ratio >= 0.8) return ['bg-warning-500', 'bg-warning-500/20', 'text-warning-600'];
  return ['bg-foreground', undefined, 'text-foreground'];
}

export function BudgetProgressBar({
  spent,
  budget,
  monthlyBudget,
  currency,
  className,
  containerClassName,
  showValues = false,
  showPercentage = true,
  bg,
}: BudgetProgressBarProps) {
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();

  const ratio = budget > 0 ? spent / budget : 0;
  const percentage = Math.min(ratio * 100, 100);
  const monthlyHint = showValues && monthlyBudget != null && currency != null
    ? ` (${formatCurrency(monthlyBudget, currency, { numberFormat, currencyFormat })}/m)`
    : null;
  const colors = getColorClass(ratio);

  return (
    <ProgressBar
      value={percentage}
      color={colors[0]}
      showPercentage={showPercentage}
      children={showValues ? monthlyHint : undefined}
      bg={colors[1] || bg || 'bg-gray-300 dark:bg-gray-700'}
      className={className}
      containerClassName={containerClassName}
    />
  );
}
