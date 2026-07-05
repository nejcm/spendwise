import type { CurrencyKey } from '@/features/currencies';

import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { FormattedCurrency, getPressedStyle, OutlineButton, Text } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { ArrowDownRight, ArrowUpRight, ChevronRight } from '@/components/ui/icon';
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
  isCompact: boolean;
  balance: number;
};

function HomeGlobalBudget({ currency, selection, isCompact, balance }: HomeGlobalBudgetProps) {
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

  const remaining = scaledBudget - spent;
  const ratio = scaledBudget > 0 ? spent / scaledBudget : 0;
  const percentage = Math.min(ratio * 100, 100);
  return (
    <View className={`px-1 ${isCompact ? 'gap-3 py-4' : 'gap-5 py-5'} ${!budget ? 'flex-row justify-between' : 'flex-col'}`}>
      <Pressable style={getPressedStyle} onPress={() => router.push('/stats')}>
        <View>
          <Text className="mb-px text-xs/snug text-muted-foreground">
            {translate('home.balance')}
          </Text>
          <FormattedCurrency
            className="text-3xl font-bold"
            value={balance}
            currency={currency}
            numberOfLines={1}
          />
        </View>
      </Pressable>
      {budget
        ? (
            <Pressable style={getPressedStyle} onPress={onPress} className="mt-1">
              <View className="flex-col gap-1.5">
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
                  className="h-3"
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
              </View>
            </Pressable>
          )
        : (
            <OutlineButton
              label={translate('home.set_budget')}
              style={getPressedStyle}
              onPress={onPress}
              size="2xs"
              className="rounded-4xl border-muted pl-3"
              textClassName="text-muted-foreground"
              iconRight={<ChevronRight size={16} colorClassName="accent-muted-foreground" className="ml-1" />}
            />
          )}
    </View>
  );
}

const bgSuccessCls = `bg-success-600/10`;
const bgDangerCls = `bg-danger-500/10`;
const textSuccessCls = `text-success-600`;
const textDangerCls = `text-danger-500`;

export default function Summary() {
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
              <HomeGlobalBudget currency={currency} selection={monthSelection} isCompact={isCompact} balance={data?.balance ?? 0} />
              {!!data?.balance
                && (
                  <View className="mt-4 flex-row gap-2">
                    <View className={`flex-1 items-start rounded-xl bg-card ${isCompact ? 'px-3 py-2.5' : 'gap-0.5 px-4 py-3'}`}>
                      <Text className="text-xs text-muted-foreground">{translate('home.income')}</Text>
                      <FormattedCurrency className="text-lg font-bold" value={data?.income ?? 0} currency={currency} prefix="+" />
                      {trend.incomeDeltaPct !== null && (
                        <View className={`flex-row gap-1 rounded-3xl px-1.5 py-0.5 ${trend.incomeDeltaPct >= 0 ? bgSuccessCls : bgDangerCls}`}>
                          {trend.incomeDeltaPct >= 0
                            ? <ArrowUpRight size={16} colorClassName="accent-green-800" />
                            : <ArrowDownRight size={16} colorClassName="accent-red-800" />}
                          <Text className={`text-xs font-medium ${trend.incomeDeltaPct >= 0 ? textSuccessCls : textDangerCls}`}>
                            {Math.abs(trend.incomeDeltaPct)}
                            %
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className={`flex-1 items-start rounded-xl bg-card ${isCompact ? 'px-3 py-2.5' : 'gap-0.5 px-4 py-3'}`}>
                      <Text className="text-xs text-muted-foreground">{translate('home.expenses')}</Text>
                      <FormattedCurrency className="text-lg font-bold" value={data?.expense ?? 0} currency={currency} prefix="-" />
                      {trend.expenseDeltaPct !== null && (
                        <View className={`flex-row gap-1 rounded-3xl px-1.5 py-0.5 ${trend.expenseDeltaPct <= 0 ? bgSuccessCls : bgDangerCls}`}>
                          {trend.expenseDeltaPct <= 0
                            ? <ArrowDownRight size={16} colorClassName="accent-green-800" />
                            : <ArrowUpRight size={16} colorClassName="accent-red-800" />}
                          <Text className={`text-xs font-medium ${trend.expenseDeltaPct <= 0 ? textSuccessCls : textDangerCls}`}>
                            {Math.abs(trend.expenseDeltaPct)}
                            %
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) }
            </>
          )}
    </View>
  );
}
