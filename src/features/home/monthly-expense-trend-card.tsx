import type { LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useCSSVariable } from 'uniwind';
import { FormattedCurrency, getPressedStyle, Text, View } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { centsToAmount } from '@/features/formatting/helpers';
import { useMonthlyTrend } from '@/features/insights/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { getMonthlyTrendChartGeometry, MONTHLY_TREND_MONTHS } from './monthly-expense-trend';

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

const TOP_LABEL_HEADROOM_RATIO = 0.15;

function getMonthLabel(month: string) {
  const monthNumber = Number(month.slice(5, 7));
  const key = MONTH_KEYS[monthNumber - 1];
  return key ? translate(key).slice(0, 3) : '';
}

export function MonthlyExpenseTrendCard() {
  const router = useRouter();
  const { data, isLoading } = useMonthlyTrend(MONTHLY_TREND_MONTHS);
  const density = useAppStore.use.density();
  const currency = useAppStore.use.currency();
  const colorScheme = useColorScheme();
  const barColor = String(
    useCSSVariable('--color-primary') ?? (colorScheme === 'dark' ? '#fafafa' : '#0a0a0a'),
  );
  const [chartWidth, setChartWidth] = React.useState(0);
  const handleChartLayout = React.useCallback((event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  }, []);

  if (isLoading) {
    return (
      <View testID="monthly-expense-trend-loading">
        <Skeleton height={density === 'compact' ? 140 : 150} />
      </View>
    );
  }

  const months = data ?? [];
  const hasExpenses = months.some((item) => item.expense > 0);
  const labelColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';
  const chartGeometry = getMonthlyTrendChartGeometry(chartWidth, months.length);
  const chartMaxValue = Math.max(...months.map((item) => centsToAmount(item.expense)), 0)
    / (1 - TOP_LABEL_HEADROOM_RATIO);

  return (
    <Pressable style={getPressedStyle} onPress={() => router.push('/stats')}>
      <View className={`overflow-hidden rounded-2xl bg-card p-4 ${density === 'compact' ? 'gap-3' : 'gap-4'}`}>
        <Text className="font-medium text-foreground">{translate('home.expense_trend')}</Text>

        {hasExpenses
          ? (
              <View testID="monthly-expense-trend-chart-container" className="items-center" onLayout={handleChartLayout}>
                {chartWidth > 0 && (
                  <BarChart
                    data={months.map((item) => ({
                      value: centsToAmount(item.expense),
                      label: getMonthLabel(item.month),
                      labelWidth: chartGeometry.barWidth,
                      labelTextStyle: { color: labelColor, fontSize: 11, textAlign: 'center' as const },
                      frontColor: barColor,
                      topLabelComponent: () => (
                        <FormattedCurrency
                          testID={`monthly-expense-value-${item.month}`}
                          value={item.expense}
                          currency={currency}
                          shorten
                          fractionDigits={1}
                          numberOfLines={1}
                          className="text-[10px] font-medium text-foreground"
                        />
                      ),
                      topLabelContainerStyle: {
                        left: -chartGeometry.spacing / 2,
                        paddingBottom: 2,
                        width: chartGeometry.barWidth + chartGeometry.spacing,
                      },
                    }))}
                    width={chartGeometry.chartWidth}
                    height={density === 'compact' ? 75 : 90}
                    maxValue={chartMaxValue}
                    barWidth={chartGeometry.barWidth}
                    spacing={chartGeometry.spacing}
                    initialSpacing={chartGeometry.initialSpacing}
                    endSpacing={chartGeometry.endSpacing}
                    barBorderTopLeftRadius={9}
                    barBorderTopRightRadius={9}
                    hideYAxisText
                    yAxisLabelWidth={0}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    disablePress
                    disableScroll
                    isAnimated
                  />
                )}
              </View>
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
