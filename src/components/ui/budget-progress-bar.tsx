/* eslint-disable react-refresh/only-export-components */
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { formatCurrency } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { BUDGET_STATE_CLASSES, getBudgetState } from './budget-state';
import { ProgressBar } from './progress-bar';
import { Text } from './text';

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
  const { bar, text } = BUDGET_STATE_CLASSES[getBudgetState(ratio, 1)];
  return [bar, undefined, text];
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
  bg = 'bg-track',
}: BudgetProgressBarProps) {
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();

  const state = getBudgetState(spent, budget);
  if (state === 'none') return null;

  const isOver = state === 'over';
  const percentage = Math.min((spent / budget) * 100, 100);
  const monthlyHint = showValues && monthlyBudget != null && currency != null
    ? ` (${formatCurrency(monthlyBudget, currency, { numberFormat, currencyFormat })}/m)`
    : null;

  return (
    <ProgressBar
      value={percentage}
      color={BUDGET_STATE_CLASSES[state].bar}
      showPercentage={showPercentage && !isOver}
      bg={bg}
      className={className}
      containerClassName={containerClassName}
    >
      {(isOver || monthlyHint) && (
        <>
          {isOver && <Text className="text-xs/snug font-medium text-negative">{translate('common.over')}</Text>}
          {monthlyHint}
        </>
      )}
    </ProgressBar>
  );
}
