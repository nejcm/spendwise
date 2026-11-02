import * as React from 'react';
import { Pressable, View } from 'react-native';
import { FormattedCurrency, getPressedStyle, Text, useModalSheet } from '@/components/ui';
import { BUDGET_STATE_CLASSES, getBudgetState } from '@/components/ui/budget-state';
import { ChevronRight } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatCurrency, todayUnix } from '@/features/formatting/helpers';
import { BudgetSheet } from '@/features/stats/components/budget-sheet';
import { daysLeftIn, getBudgetSelectionBoundaries, scaleGlobalBudget } from '@/features/stats/helpers';
import { useGlobalBudget, useGlobalBudgetSpend } from '@/features/stats/hooks';
import { cn } from '@/lib/cn';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { monthName } from '../helpers';

function endsLabel(daysLeft: number) {
  if (daysLeft === 0) return translate('home.budget.ends_today');
  if (daysLeft === 1) return translate('home.budget.ends_tomorrow');
  return translate('home.budget.days_left', { count: daysLeft });
}

export function MonthBudgetCard() {
  const yearMonth = useCurrentYearMonth();
  const [year, month] = yearMonth.split('-').map(Number);
  const selection = { mode: 'month', year, month } as const;
  const [startDate, endDate] = getBudgetSelectionBoundaries(selection);
  const { data: budget } = useGlobalBudget();
  const { data: spent = 0 } = useGlobalBudgetSpend(startDate, endDate, budget != null);
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const sheet = useModalSheet();

  const limit = budget ? scaleGlobalBudget(budget, selection) : 0;
  const left = limit - spent;
  const state = getBudgetState(spent, limit);
  const money = (cents: number) => formatCurrency(cents, currency, { numberFormat, currencyFormat });

  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => sheet.present()} style={getPressedStyle} className={`mt-4 rounded-card bg-card px-5 py-4 ${state === 'none' ? 'flex-row items-center justify-between gap-2' : 'flex-col'}`}>
        <View className="gap-1">
          <View className="flex-row items-baseline justify-between gap-2">
            <Text className="shrink text-row font-semibold" numberOfLines={1}>{translate('home.budget.title', { month: monthName(selection.month - 1) })}</Text>
            {state !== 'none' && <Text className="text-meta text-muted-foreground">{endsLabel(daysLeftIn(startDate, endDate, todayUnix()) ?? 0)}</Text>}
          </View>
          {state === 'none'
            ? <Text className="text-meta text-muted-foreground">{translate('home.budget.set')}</Text>
            : (
                <>
                  <View className="flex-row flex-wrap items-baseline justify-between gap-x-2">
                    <View className="flex-row items-baseline gap-1">
                      <FormattedCurrency value={Math.abs(left)} currency={currency} className={cn('text-2xl font-bold tracking-tight', BUDGET_STATE_CLASSES[state].text)} />
                      <Text className={cn('text-sm font-medium text-muted-foreground', state === 'over' && 'text-negative')}>
                        {translate(state === 'over' ? 'common.over' : 'home.budget.left')}
                      </Text>
                    </View>
                    <Text className="text-meta text-muted-foreground tabular-nums">
                      {translate('home.budget.of', { spent: money(spent), budget: money(limit) })}
                    </Text>
                  </View>
                  <ProgressBar value={Math.min((spent / limit) * 100, 100)} color={BUDGET_STATE_CLASSES[state].bar} showPercentage={false} className="h-2" />
                </>
              )}
        </View>
        {state === 'none' && <ChevronRight size={24} colorClassName="accent-muted-foreground" />}
      </Pressable>
      <BudgetSheet ref={sheet.ref} />
    </>
  );
}
