import type { BudgetPeriodSelection } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { FormattedCurrency, getPressedStyle, Text } from '@/components/ui';
import { BudgetProgressBar, getColorClass } from '@/components/ui/budget-progress-bar';
import { PlusIcon } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/store/local-store';
import { getBudgetSelectionBoundaries, scaleGlobalBudget } from '../helpers';
import { useGlobalBudget, useGlobalBudgetSpend } from '../hooks';

function getPeriodBudgetLabel(selection: BudgetPeriodSelection): string {
  if (selection.mode === 'year') return translate('stats.global_budget_period_annual');
  if (selection.mode === 'range') return translate('stats.global_budget_period_range');
  return translate('stats.global_budget_period_month');
}

type GlobalBudgetCardProps = {
  selection: BudgetPeriodSelection;
  currency: CurrencyKey;
};

export function GlobalBudgetCard({ selection, currency }: GlobalBudgetCardProps) {
  const { data: monthlyBudget, isLoading } = useGlobalBudget();
  const [startDate, endDate] = React.useMemo(
    () => getBudgetSelectionBoundaries(selection),
    [selection],
  );
  const scaledBudget = monthlyBudget != null ? scaleGlobalBudget(monthlyBudget, selection) : 0;
  const { data: spent = 0 } = useGlobalBudgetSpend(startDate, endDate, monthlyBudget != null);

  const handlePress = React.useCallback(() => {
    openSheet({ type: 'set-global-budget', currentAmountCents: monthlyBudget ?? null });
  }, [monthlyBudget]);

  if (isLoading) return null;
  if (monthlyBudget == null) {
    return (
      <Pressable
        onPress={handlePress}
        style={getPressedStyle}
        className="mb-6 flex-row items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-3"
      >
        <PlusIcon size={30} colorClassName="accent-muted-foreground" />
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">
            {translate('stats.global_budget_set')}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {translate('stats.global_budget_prompt')}
          </Text>
        </View>
      </Pressable>
    );
  }

  const remaining = scaledBudget - spent;
  const isOver = remaining < 0;
  const ratio = scaledBudget > 0 ? spent / scaledBudget : 0;
  const colorClass = getColorClass(ratio);

  return (
    <Pressable onPress={handlePress} style={getPressedStyle} className="mb-6">
      <View className="overflow-hidden rounded-2xl bg-card">
        <View className="p-5">
          <Text className="mb-4 text-xs font-medium text-muted-foreground">
            {translate('stats.global_budget_label')}
          </Text>

          <FormattedCurrency
            value={spent}
            currency={currency}
            className="text-3xl font-bold text-foreground"
          />

          <View className="mt-1 mb-4 flex-row items-center gap-1.5">
            <Text className="text-sm text-muted-foreground">/</Text>
            <FormattedCurrency
              value={scaledBudget}
              currency={currency}
              className="text-sm text-muted-foreground"
            />
            <Text className="text-sm text-muted-foreground">
              {getPeriodBudgetLabel(selection)}
            </Text>
          </View>

          <BudgetProgressBar
            spent={spent}
            budget={scaledBudget}
            className="h-2.5"
            showPercentage={false}
          />
        </View>

        <View className="flex-row border-t border-border">
          <View className="flex-1 items-center border-r border-border py-3.5">
            <FormattedCurrency
              value={Math.abs(remaining)}
              currency={currency}
              className={cn('text-base font-semibold', colorClass[1])}
            />
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {isOver
                ? translate('stats.budget_overspent')
                : translate('stats.budget_remaining')}
            </Text>
          </View>

          <View className="flex-1 items-center py-3.5">
            <Text className={cn('text-base font-semibold', colorClass[1])}>
              {(ratio * 100).toFixed(0)}
              %
            </Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {translate('stats.budget_used')}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
