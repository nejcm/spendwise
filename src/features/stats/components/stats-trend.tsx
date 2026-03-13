import type { MonthlyTotals, WeeklyTotals } from '@/features/insights/types';

import { format, parseISO } from 'date-fns';
import * as React from 'react';
import { useColorScheme } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { Text, View } from '@/components/ui';
import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';

export type StatsTrendProps = {
  monthlyData: MonthlyTotals[];
  weeklyData: WeeklyTotals[];
  period: 'month' | 'year' | 'week';
};

export function StatsTrend({ monthlyData, weeklyData, period }: StatsTrendProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';
  const incomeColor = isDark ? '#2ebe7e' : '#2ebe7e';
  const expenseColor = isDark ? '#e12f30' : '#e12f30';

  const barData = React.useMemo(() => {
    if (period === 'year') {
      return monthlyData.flatMap((d) => [
        {
          value: centsToAmount(d.income),
          label: format(parseISO(`${d.month}-01`), 'MMM'),
          spacing: 2,
          labelWidth: 30,
          labelTextStyle: { color: labelColor, fontSize: 10 },
          frontColor: incomeColor,
        },
        {
          value: centsToAmount(d.expense),
          frontColor: expenseColor,
          spacing: 12,
        },
      ]);
    }

    return weeklyData.flatMap((d) => [
      {
        value: centsToAmount(d.income),
        label: d.label,
        spacing: 2,
        labelWidth: 36,
        labelTextStyle: { color: labelColor, fontSize: 10 },
        frontColor: incomeColor,
      },
      {
        value: centsToAmount(d.expense),
        frontColor: expenseColor,
        spacing: 18,
      },
    ]);
  }, [period, monthlyData, weeklyData, labelColor, incomeColor, expenseColor]);

  if (barData.length === 0) return null;

  return (
    <View className="mb-6 overflow-hidden rounded-2xl bg-card p-4">
      <View className="mb-4 flex-row items-center justify-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-full" style={{ backgroundColor: incomeColor }} />
          <Text className="text-xs text-muted-foreground">{translate('common.income')}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-full" style={{ backgroundColor: expenseColor }} />
          <Text className="text-xs text-muted-foreground">{translate('common.expenses')}</Text>
        </View>
      </View>
      <BarChart
        data={barData}
        barWidth={period === 'year' ? 8 : 12}
        spacing={period === 'year' ? 12 : 18}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
        noOfSections={3}
        isAnimated
        disablePress
      />
    </View>
  );
}
