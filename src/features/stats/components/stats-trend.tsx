import type { PeriodMode } from '@/lib/store';
import * as React from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';

import { BarChart } from 'react-native-gifted-charts';
import { Text, View } from '@/components/ui';
import { useTrendByRange } from '@/features/insights/api';
import { translate } from '@/lib/i18n';
import { centsToAmount } from '../../formatting/helpers';
import { buildTrendSeries } from '../../insights/trend';

export type StatsTrendProps = {
  period: PeriodMode;
  startDate: string;
  endDate: string;
};

const PAIR_GAP = 2;

export function StatsTrend({ period, startDate, endDate }: StatsTrendProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const labelColor = isDark ? '#9ca3af' : '#6b7280';
  const incomeColor = '#2ebe7e';
  const expenseColor = '#e12f30';

  const { data } = useTrendByRange(startDate, endDate);

  const trendData = React.useMemo(() =>
    buildTrendSeries(period, startDate, endDate, data ?? []), [period, startDate, endDate, data]);

  const { barData, barWidth, spacing } = React.useMemo(() => {
    const sourceData = trendData || [];
    const groupCount = sourceData.length;
    if (groupCount === 0) {
      return { barData: [], barWidth: 8, spacing: 24 };
    }

    const availableWidth = screenWidth - 104;
    const targetBarWidth = period === 'year' ? 8 : period === 'week' ? 12 : 10;
    const minSpacing = period === 'week' ? 10 : 8;
    const computedSpacing = Math.max(
      minSpacing,
      Math.floor(availableWidth / groupCount - 2 * targetBarWidth - PAIR_GAP),
    );
    const labelWidth = 2 * targetBarWidth + PAIR_GAP;
    const labelFontSize = period === 'year' ? 9 : groupCount > 7 ? 8 : 10;

    const data = sourceData.flatMap((point) => [
      {
        value: centsToAmount(point.income),
        label: point.label,
        spacing: PAIR_GAP,
        labelWidth,
        labelTextStyle: {
          color: labelColor,
          fontSize: labelFontSize,
          textAlign: 'center' as const,
        },
        frontColor: incomeColor,
      },
      {
        value: centsToAmount(point.expense),
        frontColor: expenseColor,
      },
    ]);

    return {
      barData: data,
      barWidth: targetBarWidth,
      spacing: computedSpacing,
    };
  }, [period, trendData, labelColor, screenWidth]);

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
        key={`${period}-${startDate}-${endDate}`}
        data={barData}
        barWidth={barWidth}
        spacing={spacing}
        initialSpacing={0}
        roundedTop
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
