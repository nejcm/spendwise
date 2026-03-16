import type { MonthlyTotals, WeeklyTotals } from '@/features/insights/types';

import { format, parseISO } from 'date-fns';
import * as React from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { Text, View } from '@/components/ui';
import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';

export type StatsTrendProps = {
  monthlyData: MonthlyTotals[];
  weeklyData: WeeklyTotals[];
  period: 'month' | 'year' | 'week';
};

const PAIR_GAP = 2;

export function StatsTrend({ monthlyData, weeklyData, period }: StatsTrendProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const labelColor = isDark ? '#9ca3af' : '#6b7280';
  const incomeColor = '#2ebe7e';
  const expenseColor = '#e12f30';

  const { barData, barWidth, spacing } = React.useMemo(() => {
    const sourceData = period === 'year' ? monthlyData : weeklyData;
    const groupCount = sourceData.length;
    if (groupCount === 0) return { barData: [], barWidth: 8, spacing: 24 };

    // Available width minus padding (px-4 + p-4 each side + yAxis ~40)
    const availableWidth = screenWidth - 104;

    // Each group takes: 2 * barWidth + PAIR_GAP + spacing
    // Total: groupCount * (2 * barWidth + PAIR_GAP + spacing) ≈ availableWidth
    const targetBarWidth = period === 'year' ? 8 : 10;
    const computedSpacing = Math.max(
      8,
      Math.floor(availableWidth / groupCount - 2 * targetBarWidth - PAIR_GAP),
    );
    const labelWidth = 2 * targetBarWidth + PAIR_GAP;

    const data
      = period === 'year'
        ? monthlyData.flatMap((m) => [
            {
              value: centsToAmount(m.income),
              label: format(parseISO(`${m.month}-01`), 'MMM'),
              spacing: PAIR_GAP,
              labelWidth,
              labelTextStyle: { color: labelColor, fontSize: 9, textAlign: 'center' as const },
              frontColor: incomeColor,
            },
            {
              value: centsToAmount(m.expense),
              frontColor: expenseColor,
            },
          ])
        : weeklyData.flatMap((w) => [
            {
              value: centsToAmount(w.income),
              label: w.label,
              spacing: PAIR_GAP,
              labelWidth,
              labelTextStyle: { color: labelColor, fontSize: 10, textAlign: 'center' as const },
              frontColor: incomeColor,
            },
            {
              value: centsToAmount(w.expense),
              frontColor: expenseColor,
            },
          ]);

    return { barData: data, barWidth: targetBarWidth, spacing: computedSpacing };
  }, [period, monthlyData, weeklyData, labelColor, screenWidth]);

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
        barWidth={barWidth}
        spacing={spacing}
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
