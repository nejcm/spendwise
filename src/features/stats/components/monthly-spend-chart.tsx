import { format, parse } from 'date-fns';
import * as React from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text, View } from '@/components/ui';
import { SkeletonBox } from '@/components/ui/skeleton';
import { centsToAmount } from '@/features/formatting/helpers';
import { useMonthlyTrend } from '@/features/insights/api';
import { translate } from '@/lib/i18n';

const NUM_MONTHS = 6;
// TODO: move to theme vars (same as stats-trend.tsx)
const expenseColor = '#e12f30';
const incomeColor = '#2ebe7e';

export function MonthlySpendChart() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  const { data, isLoading } = useMonthlyTrend(NUM_MONTHS);

  const { barData, barWidth, spacing } = React.useMemo(() => {
    if (!data || data.length === 0) return { barData: [], barWidth: 16, spacing: 12 };

    const availableWidth = screenWidth - 104;
    const targetBarWidth = 14;
    const minSpacing = 8;
    const computedSpacing = Math.min(
      48,
      Math.max(
        minSpacing,
        Math.floor(availableWidth / data.length - 2 * targetBarWidth - 2),
      ),
    );

    const bars = data.flatMap((point) => {
      const label = format(parse(point.month, 'yyyy-MM', new Date()), 'MMM');
      const labelWidth = 2 * targetBarWidth + 2;
      return [
        {
          value: centsToAmount(point.income),
          label,
          spacing: 2,
          labelWidth,
          labelTextStyle: { color: labelColor, fontSize: 10, textAlign: 'center' as const },
          frontColor: incomeColor,
        },
        {
          value: centsToAmount(point.expense),
          frontColor: expenseColor,
        },
      ];
    });

    return { barData: bars, barWidth: targetBarWidth, spacing: computedSpacing };
  }, [data, labelColor, screenWidth]);

  if (isLoading) return <SkeletonBox height={160} className="mb-6" />;
  if (!data || barData.length === 0) return null;

  return (
    <View className="mb-6 overflow-hidden rounded-2xl bg-card p-4">
      <Text className="mb-3 text-sm font-medium text-foreground">
        {translate('stats.monthly_spend_chart_title')}
      </Text>
      <View className="mb-3 flex-row items-center gap-4">
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
