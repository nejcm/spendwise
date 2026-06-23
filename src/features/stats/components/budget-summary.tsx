import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { cn } from 'tailwind-variants';
import { FormattedCurrency, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { BudgetProgressBar, getColorClass } from '../../../components/ui/budget-progress-bar';

type Props = {
  totalBudget: number;
  totalSpent: number;
  currency: CurrencyKey;
  label?: string;
};

export function BudgetSummary({ totalBudget, totalSpent, currency, label }: Props) {
  const remaining = totalBudget - totalSpent;
  const isOver = remaining < 0;
  const ratio = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const colorClass = getColorClass(ratio);

  return (
    <View className="mb-6 overflow-hidden rounded-2xl bg-card">
      <View className="p-5">
        {label && (
          <Text className="mb-4 text-xs font-medium text-muted-foreground">
            {label}
          </Text>
        )}

        <FormattedCurrency
          value={totalSpent}
          currency={currency}
          className="text-3xl font-bold text-foreground"
        />

        <View className="mt-1 mb-4 flex-row items-center gap-1.5">
          <Text className="text-sm text-muted-foreground">/</Text>
          <FormattedCurrency
            value={totalBudget}
            currency={currency}
            className="text-sm text-muted-foreground"
          />
          <Text className="text-sm text-muted-foreground">
            {translate('stats.budget_summary')}
          </Text>
        </View>

        <BudgetProgressBar spent={totalSpent} budget={totalBudget} className="h-2.5" showPercentage={false} />
      </View>

      <View className="flex-row border-t border-border">
        <View className="flex-1 items-center border-r border-border py-3">
          <FormattedCurrency
            value={Math.abs(remaining)}
            currency={currency}
            className={cn('text-base font-semibold', colorClass[2])}
          />
          <Text className="text-xs text-muted-foreground">
            {isOver
              ? translate('stats.budget_overspent')
              : translate('stats.budget_remaining')}
          </Text>
        </View>

        <View className="flex-1 items-center py-3">
          <Text className={cn('text-base font-semibold', colorClass[2])}>
            {(ratio * 100).toFixed(0)}
            %
          </Text>
          <Text className="text-xs text-muted-foreground">
            {translate('stats.budget_used')}
          </Text>
        </View>
      </View>
    </View>
  );
}
