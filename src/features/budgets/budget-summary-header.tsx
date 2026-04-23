import type { BudgetOverviewItem } from './types';
import { format } from 'date-fns';

import * as React from 'react';
import { View } from 'react-native';
import { FormattedCurrency, Text } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { translate } from '@/lib/i18n';

import { useAppStore } from '@/lib/store/store';

type Props = {
  items: BudgetOverviewItem[];
  recommendationCount?: number;
};

export function BudgetSummaryHeader({ items, recommendationCount = 0 }: Props) {
  const currency = useAppStore.use.currency();

  const totalBudget = items.reduce((s, i) => s + i.effective_budget, 0);
  const totalSpent = items.reduce((s, i) => s + i.spent, 0);
  const remaining = totalBudget - totalSpent;

  const monthLabel = format(new Date(), 'MMMM yyyy');

  return (
    <View className="mx-4 mb-4 gap-3 rounded-2xl bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-foreground">{translate('budgets.title')}</Text>
        <Text className="text-sm text-muted-foreground">{monthLabel}</Text>
      </View>

      <BudgetProgressBar
        spent={totalSpent}
        budget={totalBudget}
        showValues={false}
        showPercentage={false}
        bg="bg-muted"
      />

      <View className="flex-row justify-between">
        <View className="gap-0.5">
          <Text className="text-xs text-muted-foreground">{translate('budgets.spent')}</Text>
          <FormattedCurrency className="text-base font-semibold text-danger-500" value={totalSpent / 100} currency={currency} />
        </View>
        <View className="items-center gap-0.5">
          <Text className="text-xs text-muted-foreground">{translate('budgets.total_budget')}</Text>
          <FormattedCurrency className="text-base font-semibold text-foreground" value={totalBudget / 100} currency={currency} />
        </View>
        <View className="items-end gap-0.5">
          <Text className="text-xs text-muted-foreground">{translate('budgets.remaining')}</Text>
          <FormattedCurrency
            className={remaining >= 0 ? 'text-base font-semibold text-success-600' : 'text-base font-semibold text-danger-500'}
            value={Math.abs(remaining) / 100}
            currency={currency}
            prefix={remaining < 0 ? '-' : ''}
          />
        </View>
      </View>

      {recommendationCount > 0 && (
        <View className="rounded-xl bg-warning-500/10 px-3 py-2">
          <Text className="text-xs text-warning-600 dark:text-warning-400">
            {`${recommendationCount} budget suggestion${recommendationCount > 1 ? 's' : ''} available`}
          </Text>
        </View>
      )}
    </View>
  );
}
