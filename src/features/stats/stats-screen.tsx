import * as React from 'react';
import { useMemo } from 'react';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, ScrollView, Text, View } from '@/components/ui';
import {
  useCategorySpendByRange,
  useMonthlyTrendForYear,
  useSummaryByRange,
  useWeeklyTrend,
} from '@/features/insights/api';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { setPeriodSelection, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { CategoryBreakdown } from './components/category-breakdown';
import { StatsTrend } from './components/stats-trend';
import { Summary } from './components/summary';

export function StatsScreen() {
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);

  const trendPeriod = selection.mode === 'year' ? 'year' : selection.mode === 'week' ? 'week' : 'month';

  const yearMonth = useMemo(() => {
    if (selection.mode === 'month') {
      return `${selection.year}-${String(selection.month).padStart(2, '0')}`;
    }
    return startDate.substring(0, 7);
  }, [selection, startDate]);

  const { data: summary } = useSummaryByRange(startDate, endDate);
  const { data: categorySpend = [] } = useCategorySpendByRange(startDate, endDate);
  const { data: weeklyTrend = [] } = useWeeklyTrend(yearMonth);
  const trendYear = selection.mode === 'custom'
    ? new Date(selection.startDate).getFullYear()
    : selection.year;
  const { data: monthlyTrend = [] } = useMonthlyTrendForYear(trendYear);

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />

      <PeriodSelector selection={selection} onSelect={setPeriodSelection} />

      <ScrollView className="flex-1 px-4 pt-2 pb-6" style={defaultStyles.transparentBg}>
        <Text className="pb-4 text-center text-2xl font-medium">{translate('stats.title')}</Text>
        {summary && (
          <Summary
            income={summary.income}
            expense={summary.expense}
            balance={summary.balance}
            currency={currency}
          />
        )}

        <StatsTrend
          key={`${trendPeriod}-${startDate}`}
          monthlyData={monthlyTrend}
          weeklyData={weeklyTrend}
          period={trendPeriod}
        />

        <CategoryBreakdown
          categories={categorySpend}
          currency={currency}
          type="expense"
          limit={10}
        />

        <CategoryBreakdown
          categories={categorySpend}
          currency={currency}
          type="income"
          limit={8}
        />
      </ScrollView>
    </View>
  );
}
