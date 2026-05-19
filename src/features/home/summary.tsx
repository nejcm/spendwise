import type { CurrencyKey } from '@/features/currencies';

import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { FormattedCurrency, getPressedStyle, Text } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { ChevronRight } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { SkeletonGrid } from '@/components/ui/skeleton';
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
  const { data: budget } = useGlobalBudget();
  const [startDate, endDate] = React.useMemo(
    () => getBudgetSelectionBoundaries(selection),
    [selection],
  );
  const scaledBudget = budget != null ? scaleGlobalBudget(budget, selection) : 0;
  const { data: spent = 0 } = useGlobalBudgetSpend(startDate, endDate, budget != null);
  const onPress = () => {
    router.push('/stats/global-budget');
  };

  if (!budget) {
    return (
      <Pressable style={getPressedStyle} onPress={onPress}>
        <View className="flex-row items-center gap-1 self-start rounded-md border border-dashed border-border px-3 py-1.5">
          <Text className="text-xs text-muted-foreground">{translate('home.set_budget')}</Text>
          <ChevronRight size={16} colorClassName="accent-muted-foreground" />
        </View>
      </Pressable>
    );
  }

  const remaining = scaledBudget - spent;
  const ratio = scaledBudget > 0 ? spent / scaledBudget : 0;
  const percentage = Math.min(ratio * 100, 100);
  return (
    <>
      <Pressable style={getPressedStyle} onPress={onPress} className="mt-3 flex gap-2">
        <View className="flex-row items-center justify-between gap-1">
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-muted-foreground">
              {translate('home.budget_label')}
              :
            </Text>
            <FormattedCurrency value={spent} currency={currency} fractionDigits={0} className="text-xs text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">/</Text>
            <FormattedCurrency value={scaledBudget} currency={currency} fractionDigits={0} className="text-xs text-muted-foreground" />
          </View>
          <Text className="text-xs text-muted-foreground">{`${percentage.toFixed(0)}%`}</Text>
        </View>
        <BudgetProgressBar
          spent={spent}
          budget={scaledBudget}
          showPercentage={false}
          className="h-2"
          bg="bg-muted"
        />
        <View className="flex-row gap-1">
          <FormattedCurrency
            value={Math.abs(remaining)}
            currency={currency}
            fractionDigits={0}
            className="text-xs text-muted-foreground"
          />
          <Text className="text-xs text-muted-foreground">
            {remaining < 0 ? translate('stats.budget_overspent') : translate('stats.budget_remaining')}
          </Text>
        </View>
      </Pressable>
    </>
  );
}

const textBaseCls = 'rounded-3xl px-2 py-0.5 text-xs font-medium';
const textSuccessCls = `bg-success-600/10 text-success-600`;
const textDangerCls = `bg-danger-500/10 text-danger-500`;

export default function Summary() {
  const router = useRouter();
  const isCompact = useAppStore.use.density() === 'compact';
  const currency = useAppStore.use.currency();
  const monthSelection = React.useMemo(() => currentMonthSelection(), []);
  const currentYearMonth = React.useMemo(
    () => format(new Date(monthSelection.year, monthSelection.month - 1, 1), 'yyyy-MM'),
    [monthSelection],
  );
  const { data, isPending } = useMonthSummary(currentYearMonth);
  const trend = useMonthTrend(currentYearMonth);

  return (
    <View>
      {isPending
        ? (
            <SkeletonGrid cols={2} rows={2} heights={[76, 76]} className="mt-4" />
          )
        : (
            <>
              <View className={`mb-2 rounded-xl bg-card p-3 3xs:p-5 ${isCompact ? 'gap-1' : 'gap-2 2xs:p-6'}`}>
                <Pressable style={getPressedStyle} onPress={() => router.push('/stats')}>
                  <View>
                    <Label className="mb-1 text-muted-foreground">
                      {translate('home.balance')}
                    </Label>
                    <FormattedCurrency
                      className="text-2xl font-bold"
                      value={data?.balance ?? 0}
                      currency={currency}
                      numberOfLines={1}
                    />
                  </View>
                </Pressable>
                <HomeGlobalBudget currency={currency} selection={monthSelection} />
              </View>
              <View className="flex-row gap-2">
                <View className={`flex-1 items-start rounded-xl bg-card ${isCompact ? 'px-3 py-2.5' : 'gap-0.5 px-4 py-3'}`}>
                  <Label className="text-muted-foreground">{translate('home.income')}</Label>
                  <FormattedCurrency className="text-lg font-bold" value={data?.income ?? 0} currency={currency} prefix="+" />
                  {trend.incomeDeltaPct !== null && trend.incomeDeltaPct !== 0 && (
                    <Text className={`${textBaseCls} ${trend.incomeDeltaPct >= 0 ? textSuccessCls : textDangerCls}`}>
                      {trend.incomeDeltaPct >= 0 ? '↑' : '↓'}
                      {' '}
                      {Math.abs(trend.incomeDeltaPct)}
                      %
                    </Text>
                  )}
                </View>
                <View className={`flex-1 items-start rounded-xl bg-card ${isCompact ? 'px-3 py-2.5' : 'gap-0.5 px-4 py-3'}`}>
                  <Label className="text-muted-foreground">{translate('home.expenses')}</Label>
                  <FormattedCurrency className="text-lg font-bold" value={data?.expense ?? 0} currency={currency} prefix="-" />
                  {trend.expenseDeltaPct !== null && trend.expenseDeltaPct !== 0 && (
                    <Text className={`${textBaseCls} ${trend.expenseDeltaPct <= 0 ? textSuccessCls : textDangerCls}`}>
                      {trend.expenseDeltaPct >= 0 ? '↑' : '↓'}
                      {' '}
                      {Math.abs(trend.expenseDeltaPct)}
                      %
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}
    </View>
  );
}
