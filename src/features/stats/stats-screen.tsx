import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { Period } from './types';
import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react-native';

import * as React from 'react';
import { MonthPicker, YearPicker } from '@/components/month-year-picker';
import { FocusAwareStatusBar, Pressable, ScrollView, Text, View } from '@/components/ui';
import {
  useCategorySpend,
  useCategorySpendForYear,
  useMonthlyTrend,
  useWeeklyTrend,
  useYearlySummary,
} from '@/features/insights/api';
import { useMonthSummary } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';

import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { IconButton } from '../../components/ui/icon-button';
import { CategoryBreakdown } from './components/category-breakdown';
import { PeriodToggle } from './components/period-toggle';
import { StatsTrend } from './components/stats-trend';
import { Summary } from './components/summary';

export function StatsScreen() {
  const currency = useAppStore.use.currency();
  const [period, setPeriod] = React.useState<Period>('month');
  const [selectedDate, setSelectedDate] = React.useState<[number, number]>(() => {
    const split = format(new Date(), 'yyyy-MM').split('-');
    return [Number(split[0]), Number(split[1])];
  });

  const [selectedYear, setSelectedYear] = React.useState(() => new Date().getFullYear());

  const monthPickerRef = React.useRef<BottomSheetModal>(null);
  const yearPickerRef = React.useRef<BottomSheetModal>(null);

  const yearMonth = `${selectedDate[0]}-${String(selectedDate[1]).padStart(2, '0')}`;

  // Month view hooks
  const { data: monthSummary } = useMonthSummary(yearMonth);
  const { data: monthCategorySpend = [] } = useCategorySpend(yearMonth);
  const { data: weeklyTrend = [] } = useWeeklyTrend(yearMonth);

  // Year view hooks
  const { data: yearlySummary } = useYearlySummary(selectedYear);
  const { data: yearCategorySpend = [] } = useCategorySpendForYear(selectedYear);
  const { data: monthlyTrend = [] } = useMonthlyTrend(12);

  const summary = period === 'month' ? monthSummary : yearlySummary;
  const categorySpend = period === 'month' ? monthCategorySpend : yearCategorySpend;

  const monthName = React.useMemo(
    () => format(new Date(selectedDate[0], selectedDate[1] - 1, 1), 'MMMM'),
    [selectedDate],
  );

  const navigateMonth = (direction: -1 | 1) => {
    const d = new Date(selectedDate[0], selectedDate[1] - 1 + direction, 1);
    setSelectedDate([d.getFullYear(), d.getMonth() + 1]);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 py-6" style={defaultStyles.transparentBg}>
        <FocusAwareStatusBar />
        <Text className="pb-4 text-center text-2xl font-medium">{translate('stats.title')}</Text>
        <PeriodToggle value={period} onChange={setPeriod} />

        {period === 'week'
          && (
            <View className="flex-row items-center justify-between pb-6">
              <IconButton size="sm" color="none" onPress={() => navigateMonth(-1)} hitSlop={12}>
                <ArrowLeftIcon className="size-5 text-muted-foreground" />
              </IconButton>
              <View className="flex-row items-center gap-1">
                <Pressable onPress={() => monthPickerRef.current?.present()} hitSlop={12}>
                  <Text className="text-lg font-medium text-muted-foreground">{format(new Date(), 'MMMM')}</Text>
                </Pressable>
              </View>
              <IconButton size="sm" color="none" onPress={() => navigateMonth(1)} hitSlop={12}>
                <ArrowRightIcon className="size-5 text-muted-foreground" />
              </IconButton>
            </View>
          )}
        {period === 'month'
          && (
            <View className="flex-row items-center justify-between pb-6">
              <IconButton size="sm" color="none" onPress={() => navigateMonth(-1)} hitSlop={12}>
                <ArrowLeftIcon className="size-5 text-muted-foreground" />
              </IconButton>
              <View className="flex-row items-center gap-1">
                <Pressable onPress={() => monthPickerRef.current?.present()} hitSlop={12}>
                  <Text className="text-lg font-medium text-muted-foreground">{monthName}</Text>
                </Pressable>
                <Pressable onPress={() => yearPickerRef.current?.present()} hitSlop={12}>
                  <Text className="text-lg font-medium text-muted-foreground">{selectedDate[0]}</Text>
                </Pressable>
              </View>
              <IconButton size="sm" color="none" onPress={() => navigateMonth(1)} hitSlop={12}>
                <ArrowRightIcon className="size-5 text-muted-foreground" />
              </IconButton>
            </View>
          )}
        {period === 'year'
          && (
            <View className="flex-row items-center justify-between pb-6">
              <IconButton size="sm" color="none" onPress={() => setSelectedYear((y) => y - 1)} hitSlop={12}>
                <ArrowLeftIcon className="size-5 text-muted-foreground" />
              </IconButton>
              <Pressable onPress={() => yearPickerRef.current?.present()} hitSlop={12}>
                <Text className="text-lg font-medium text-muted-foreground">{selectedYear}</Text>
              </Pressable>
              <IconButton size="sm" color="none" onPress={() => setSelectedYear((y) => y + 1)} hitSlop={12}>
                <ArrowRightIcon className="size-5 text-muted-foreground" />
              </IconButton>
            </View>
          )}

        {summary && (
          <Summary
            income={summary.income}
            expense={summary.expense}
            balance={summary.balance}
            currency={currency}
          />
        )}

        <StatsTrend
          monthlyData={monthlyTrend}
          weeklyData={weeklyTrend}
          period={period}
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

      <MonthPicker
        ref={monthPickerRef}
        selectedMonth={selectedDate[1]}
        onSelect={(month) => setSelectedDate((prev) => [prev[0], month])}
      />
      <YearPicker
        ref={yearPickerRef}
        selectedYear={period === 'month' ? selectedDate[0] : selectedYear}
        onSelect={(year) => {
          if (period === 'month') {
            setSelectedDate((prev) => [year, prev[1]]);
          }
          else {
            setSelectedYear(year);
          }
        }}
      />
    </View>
  );
}
