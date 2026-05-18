import type { CurrencyKey } from '@/features/currencies';

import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { FormattedCurrency, getPressedStyle, Text } from '@/components/ui';
import { BudgetProgressBar, getColorClass } from '@/components/ui/budget-progress-bar';
import { ChevronRight, PlusIcon } from '@/components/ui/icon';
import { Skeleton, SkeletonGrid } from '@/components/ui/skeleton';
import { getBudgetSelectionBoundaries, scaleGlobalBudget } from '@/features/stats/helpers';
import { useGlobalBudget, useGlobalBudgetSpend } from '@/features/stats/hooks';
import { useMonthSummary, useMonthTrend } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

type MonthSelection = {
  mode: 'month';
  year: number;
  month: number;
};

function currentMonthSelection(): MonthSelection {
  const now = new Date();

  return {
    mode: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

type HomeGlobalBudgetProps = {
  currency: CurrencyKey;
  selection: MonthSelection;
};

function HomeGlobalBudget({ currency, selection }: HomeGlobalBudgetProps) {
  const router = useRouter();
  const { data: budget, isLoading } = useGlobalBudget();
  const [startDate, endDate] = React.useMemo(
    () => getBudgetSelectionBoundaries(selection),
    [selection],
  );
  const scaledBudget = budget != null ? scaleGlobalBudget(budget, selection) : 0;
  const { data: spent = 0 } = useGlobalBudgetSpend(startDate, endDate, budget != null);

  const handlePress = React.useCallback(() => {
    router.push('/stats/global-budget');
  }, [router]);

  if (isLoading) {
    return <Skeleton className="mt-3" height={68} />;
  }

  if (budget == null) {
    return (
      <Pressable
        className="mt-3 flex-row items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-4 py-3"
        style={getPressedStyle}
        onPress={handlePress}
      >
        <PlusIcon size={20} colorClassName="accent-muted-foreground" />
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">{translate('stats.global_budget_set')}</Text>
          <Text className="text-xs text-muted-foreground">{translate('stats.global_budget_prompt')}</Text>
        </View>
        <ChevronRight size={18} colorClassName="accent-muted-foreground" />
      </Pressable>
    );
  }

  const remaining = scaledBudget - spent;
  const ratio = scaledBudget > 0 ? spent / scaledBudget : 0;
  const colorClass = getColorClass(ratio)[1];

  return (
    <Pressable
      className="mt-3 rounded-xl bg-card px-4 py-3"
      style={getPressedStyle}
      onPress={handlePress}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">{translate('stats.global_budget_label')}</Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <FormattedCurrency value={spent} currency={currency} className="text-xs text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">/</Text>
            <FormattedCurrency value={scaledBudget} currency={currency} className="text-xs text-muted-foreground" />
          </View>
        </View>
        <View className="items-end">
          <FormattedCurrency
            value={Math.abs(remaining)}
            currency={currency}
            className={`text-sm font-semibold ${colorClass}`}
          />
          <Text className="text-xs text-muted-foreground">
            {remaining < 0 ? translate('stats.budget_overspent') : translate('stats.budget_remaining')}
          </Text>
        </View>
      </View>
      <BudgetProgressBar
        spent={spent}
        budget={scaledBudget}
        className="h-2"
        containerClassName="mt-3"
        bg="bg-muted"
      />
    </Pressable>
  );
}

export default function Summary() {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const profile = useAppStore.use.profile();
  const name = profile?.name?.trim() || translate('common.there');
  const monthSelection = React.useMemo(() => currentMonthSelection(), []);
  const currentYearMonth = React.useMemo(
    () => format(new Date(monthSelection.year, monthSelection.month - 1, 1), 'yyyy-MM'),
    [monthSelection],
  );
  const { data, isLoading } = useMonthSummary(currentYearMonth);
  const trend = useMonthTrend(currentYearMonth);

  return (
    <View>
      <View className="flex-row items-center justify-between gap-2">
        <View>
          <Text className="text-lg font-medium text-foreground">{translate('home.hi', { name })}</Text>
          <Text className="text-sm text-muted-foreground">{translate('home.available_balance')}</Text>
        </View>
        <View className="items-end">
          {isLoading
            ? <Skeleton height={32} width={120} />
            : <FormattedCurrency className="mt-1 text-2xl font-bold" value={data?.balance ?? 0} currency={currency} />}
        </View>
      </View>
      <View className="mt-4 flex-row gap-2">
        {isLoading
          ? (
              <SkeletonGrid cols={2} rows={1} heights={[76, 76]} />
            )
          : (
              <>
                <Pressable className="flex-1" style={getPressedStyle} onPress={() => router.push('/stats')}>
                  <View className="gap-0.5 rounded-xl bg-success-500/8 px-4 py-3 dark:bg-success-700/10">
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text className="text-sm text-foreground">{translate('home.income')}</Text>
                      {trend.incomeDeltaPct !== null && trend.incomeDeltaPct !== 0 && (
                        <Text className={`text-xs font-medium ${trend.incomeDeltaPct >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                          {trend.incomeDeltaPct >= 0 ? '↑' : '↓'}
                          {' '}
                          {Math.abs(trend.incomeDeltaPct)}
                          %
                        </Text>
                      )}
                    </View>
                    <FormattedCurrency className="text-lg font-bold text-success-600" value={data?.income ?? 0} currency={currency} prefix="+" />
                  </View>
                </Pressable>
                <Pressable className="flex-1" style={getPressedStyle} onPress={() => router.push('/stats')}>
                  <View className="gap-0.5 rounded-xl bg-danger-500/8 px-4 py-3 dark:bg-danger-600/6">
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text className="text-sm text-foreground">{translate('home.expenses')}</Text>
                      {trend.expenseDeltaPct !== null && trend.expenseDeltaPct !== 0 && (
                        <Text className={`text-xs font-medium ${trend.expenseDeltaPct <= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                          {trend.expenseDeltaPct >= 0 ? '↑' : '↓'}
                          {' '}
                          {Math.abs(trend.expenseDeltaPct)}
                          %
                        </Text>
                      )}
                    </View>
                    <FormattedCurrency className="text-lg font-bold text-danger-500" value={data?.expense ?? 0} currency={currency} prefix="-" />
                  </View>
                </Pressable>
              </>
            )}
      </View>
      <HomeGlobalBudget currency={currency} selection={monthSelection} />
    </View>
  );
}
