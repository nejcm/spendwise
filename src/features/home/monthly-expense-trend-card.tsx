import type { MonthlyTotals } from '@/features/insights/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, useColorScheme, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { FormattedCurrency, getPressedStyle, Text, View } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { centsToAmount } from '@/features/formatting/helpers';
import { useMonthlyTrend } from '@/features/insights/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { expenseColor } from '@/lib/theme/colors';
import { buildMonthlyExpenseTrendModel } from './monthly-expense-trend';

const MONTH_KEYS = [
  'date.months.m1',
  'date.months.m2',
  'date.months.m3',
  'date.months.m4',
  'date.months.m5',
  'date.months.m6',
  'date.months.m7',
  'date.months.m8',
  'date.months.m9',
  'date.months.m10',
  'date.months.m11',
  'date.months.m12',
] as const;

function getMonthLabel(month: string) {
  const monthNumber = Number(month.slice(5, 7));
  const key = MONTH_KEYS[monthNumber - 1];
  return key ? translate(key).slice(0, 3) : '';
}

function getComparisonText(data: MonthlyTotals[]) {
  const model = buildMonthlyExpenseTrendModel(data);

  if (model.direction === 'same') return translate('home.expense_trend_same');
  if (model.direction === 'unavailable') return translate('home.expense_trend_unavailable');

  return translate(
    model.direction === 'lower' ? 'home.expense_trend_lower' : 'home.expense_trend_higher',
    { percentage: model.percentage },
  );
}

export function MonthlyExpenseTrendCard() {
  const router = useRouter();
  const { data, isLoading } = useMonthlyTrend(6);
  const currency = useAppStore.use.currency();
  const density = useAppStore.use.density();
  const colorScheme = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();

  if (isLoading) {
    return (
      <View testID="monthly-expense-trend-loading">
        <Skeleton height={density === 'compact' ? 190 : 220} />
      </View>
    );
  }

  const months = data ?? [];
  const model = buildMonthlyExpenseTrendModel(months);
  const hasExpenses = months.some((item) => item.expense > 0);
  const labelColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';
  const previousBarColor = colorScheme === 'dark' ? '#52525b' : '#d4d4d8';
  const chartWidth = Math.max(screenWidth - 96, 220);
  const barWidth = Math.min(28, Math.floor(chartWidth / 12));
  const spacing = Math.max(10, Math.floor((chartWidth - barWidth * months.length) / Math.max(months.length - 1, 1)));

  return (
    <Pressable style={getPressedStyle} onPress={() => router.push('/stats')}>
      <View className={`overflow-hidden rounded-2xl bg-card p-4 ${density === 'compact' ? 'gap-3' : 'gap-4'}`}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-medium text-foreground">{translate('home.expense_trend')}</Text>
            <Text className="mt-1 text-sm text-muted-foreground">{getComparisonText(months)}</Text>
          </View>
          <FormattedCurrency
            value={model.currentExpense}
            currency={currency}
            fractionDigits={0}
            className="font-medium text-foreground"
          />
        </View>

        {hasExpenses
          ? (
              <BarChart
                data={months.map((item, index) => ({
                  value: centsToAmount(item.expense),
                  label: getMonthLabel(item.month),
                  frontColor: index === months.length - 1 ? expenseColor : previousBarColor,
                }))}
                width={chartWidth}
                height={density === 'compact' ? 110 : 132}
                barWidth={barWidth}
                spacing={spacing}
                initialSpacing={0}
                endSpacing={0}
                barBorderTopLeftRadius={5}
                barBorderTopRightRadius={5}
                hideYAxisText
                yAxisLabelWidth={0}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{ color: labelColor, fontSize: 10 }}
                hideRules
                disablePress
                isAnimated
              />
            )
          : (
              <View className="items-center py-8">
                <Text className="text-sm text-muted-foreground">{translate('home.expense_trend_empty')}</Text>
              </View>
            )}
      </View>
    </Pressable>
  );
}
