import type { Href } from 'expo-router';
import * as React from 'react';

import { useColorScheme, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import ScreenHeader from '@/components/screen-header';
import { FocusAwareStatusBar, ScrollView, Text, View } from '@/components/ui';

import { FormattedCurrency } from '@/components/ui/formatted-text';
import { SkeletonBox } from '@/components/ui/skeleton';
import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';

import { useBudgetMonthlyHistory, useBudgetOverview, useRolloverHistory } from './hooks';
import { dailyProjection, daysLeftInMonth, formatYearMonth } from './rollover';

type Props = {
  categoryId: string;
};

export function BudgetDetailScreen({ categoryId }: Props) {
  const currency = useAppStore.use.currency();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  const { data: overview = [] } = useBudgetOverview();
  const { data: history = [], isLoading: histLoading } = useBudgetMonthlyHistory(categoryId);
  const { data: rolloverHistory = [] } = useRolloverHistory(categoryId);

  const item = overview.find((i) => i.category_id === categoryId);

  // Build bar chart data: spent bar + budget outline bar for each month
  const barData = React.useMemo(() => {
    if (history.length === 0) return [];
    const availableWidth = screenWidth - 104;
    const groupCount = history.length;

    return history.flatMap((h) => {
      const labelWidth = 40;
      const ymStr = formatYearMonth(h.year_month).slice(0, 3); // "Jan"
      return [
        {
          value: centsToAmount(h.spent),
          label: ymStr,
          spacing: 4,
          labelWidth,
          labelTextStyle: { color: labelColor, fontSize: 10 },
          frontColor: h.spent > h.budget ? '#e12f30' : '#3b82f6',
        },
        {
          value: centsToAmount(h.budget),
          frontColor: isDark ? '#374151' : '#e5e7eb',
        },
      ];
    });
  }, [history, labelColor, isDark, screenWidth]);

  if (!item) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScreenHeader title={translate('budgets.title')} backHref={'/budgets' as Href} />
        <View className="flex-1 gap-4 px-4 pt-8">
          <SkeletonBox height={120} className="rounded-2xl" />
          <SkeletonBox height={200} className="rounded-2xl" />
        </View>
      </>
    );
  }

  const remaining = item.effective_budget - item.spent;
  const isOver = remaining < 0;
  const daily = dailyProjection(remaining);
  const daysLeft = daysLeftInMonth();
  return (
    <>
      <FocusAwareStatusBar />
      <ScreenHeader title={item.category_name} backHref={'/budgets' as Href} />
      <ScrollView className="flex-1" style={defaultStyles.transparentBg}>
        <View className="gap-4 px-4 pt-4 pb-8">

          {/* Current month card */}
          <View className="gap-3 rounded-2xl bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View
                className="size-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${item.category_color}33` }}
              >
                <Text className="text-2xl">{item.category_icon ?? '📂'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">{item.category_name}</Text>
                {item.rollover_amount !== 0 && (
                  <Text className="text-xs text-primary">
                    {item.rollover_amount > 0 ? '+' : ''}
                    {centsToAmount(item.rollover_amount).toFixed(2)}
                    {' '}
                    rollover
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="gap-0.5">
                <Text className="text-xs text-muted-foreground">{translate('budgets.spent')}</Text>
                <FormattedCurrency className="text-base font-semibold text-danger-500" value={centsToAmount(item.spent)} currency={currency} />
              </View>
              <View className="items-center gap-0.5">
                <Text className="text-xs text-muted-foreground">{translate('budgets.effective_budget')}</Text>
                <FormattedCurrency className="text-base font-semibold text-foreground" value={centsToAmount(item.effective_budget)} currency={currency} />
              </View>
              <View className="items-end gap-0.5">
                <Text className="text-xs text-muted-foreground">{translate('budgets.remaining')}</Text>
                <FormattedCurrency
                  className={isOver ? 'text-base font-semibold text-danger-500' : 'text-base font-semibold text-success-600'}
                  value={Math.abs(centsToAmount(remaining))}
                  currency={currency}
                  prefix={isOver ? '-' : ''}
                />
              </View>
            </View>
          </View>

          {/* Daily projection */}
          <View className="flex-row items-center justify-between rounded-2xl bg-card p-4">
            <View>
              <Text className="text-sm font-medium text-foreground">{translate('budgets.daily_projection')}</Text>
              <Text className="text-xs text-muted-foreground">
                {translate('budgets.days_left', { days: daysLeft } as never)}
              </Text>
            </View>
            {isOver
              ? <Text className="text-base font-bold text-danger-500">{translate('budgets.over_budget')}</Text>
              : (
                  <View className="items-end">
                    <FormattedCurrency className="text-base font-bold text-foreground" value={centsToAmount(daily)} currency={currency} />
                    <Text className="text-xs text-success-600">{translate('budgets.on_track')}</Text>
                  </View>
                )}
          </View>

          {/* Trend chart */}
          <View className="gap-3 rounded-2xl bg-card p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-foreground">{translate('budgets.trend_title')}</Text>
              <View className="flex-row gap-3">
                <View className="flex-row items-center gap-1.5">
                  <View className="size-2.5 rounded-full bg-primary" />
                  <Text className="text-xs text-muted-foreground">{translate('budgets.spent')}</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="size-2.5 rounded-full bg-muted-foreground/30" />
                  <Text className="text-xs text-muted-foreground">{translate('budgets.total_budget')}</Text>
                </View>
              </View>
            </View>
            {histLoading
              ? <SkeletonBox height={120} />
              : barData.length > 0
                ? (
                    <BarChart
                      data={barData}
                      barWidth={20}
                      spacing={8}
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
                  )
                : <Text className="text-sm text-muted-foreground">{translate('common.no_data')}</Text>}
          </View>

          {/* Rollover history */}
          {rolloverHistory.length > 0 && (
            <View className="gap-3 rounded-2xl bg-card p-4">
              <Text className="text-sm font-medium text-foreground">{translate('budgets.rollover_history')}</Text>
              {rolloverHistory.map((row) => (
                <View key={row.year_month} className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">{formatYearMonth(row.year_month)}</Text>
                  <Text className={`text-sm font-medium ${row.rollover_amount >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                    {row.rollover_amount >= 0 ? '+' : ''}
                    {centsToAmount(row.rollover_amount).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

        </View>
      </ScrollView>
    </>
  );
}
