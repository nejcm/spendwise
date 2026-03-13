import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react-native';
import * as React from 'react';

import { MonthPicker, YearPicker } from '@/components/month-year-picker';
import { FocusAwareStatusBar, Pressable, ScrollView, Text, View } from '@/components/ui';
import {
  useCategorySpend,
  useCategorySpendForYear,
  useMonthlyTrend,
  useYearlySummary,
} from '@/features/insights/api';
import { useMonthSummary } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

import { defaultStyles } from '@/lib/theme/styles';
import { CategoryBreakdown } from './components/category-breakdown';
import { PeriodToggle } from './components/period-toggle';
import { StatsTrend } from './components/stats-trend';
import { Summary } from './components/summary';

type Period = 'month' | 'year';

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

  const yearMonth = selectedDate.join('-');

  // Month view hooks
  const { data: monthSummary } = useMonthSummary(yearMonth);
  const { data: monthCategorySpend = [] } = useCategorySpend(yearMonth);
  const { data: trendMonth = [] } = useMonthlyTrend(6);

  // Year view hooks
  const { data: yearlySummary } = useYearlySummary(selectedYear);
  const { data: yearCategorySpend = [] } = useCategorySpendForYear(selectedYear);
  const { data: trendYear = [] } = useMonthlyTrend(12);

  const summary = period === 'month' ? monthSummary : yearlySummary;
  const categorySpend = period === 'month' ? monthCategorySpend : yearCategorySpend;
  const trend = period === 'month' ? trendMonth : trendYear;

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

        {period === 'month'
          ? (
              <View className="flex-row items-center justify-between pb-6">
                <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
                  <ArrowLeftIcon className="size-5 text-muted-foreground" />
                </Pressable>
                <View className="flex-row items-center gap-1">
                  <Pressable onPress={() => monthPickerRef.current?.present()} hitSlop={12}>
                    <Text className="text-lg font-medium text-subtle-3">{monthName}</Text>
                  </Pressable>
                  <Pressable onPress={() => yearPickerRef.current?.present()} hitSlop={12}>
                    <Text className="text-lg font-medium text-subtle-3">{selectedDate[0]}</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
                  <ArrowRightIcon className="size-5 text-muted-foreground" />
                </Pressable>
              </View>
            )
          : (
              <View className="flex-row items-center justify-between pb-6">
                <Pressable onPress={() => setSelectedYear((y) => y - 1)} hitSlop={12}>
                  <ArrowLeftIcon className="size-5 text-muted-foreground" />
                </Pressable>
                <Pressable onPress={() => yearPickerRef.current?.present()} hitSlop={12}>
                  <Text className="text-lg font-medium text-card-foreground">{selectedYear}</Text>
                </Pressable>
                <Pressable onPress={() => setSelectedYear((y) => y + 1)} hitSlop={12}>
                  <ArrowRightIcon className="size-5 text-muted-foreground" />
                </Pressable>
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

        <CategoryBreakdown
          categories={categorySpend}
          currency={currency}
          type="expense"
          limit={5}
        />

        <StatsTrend
          data={trend}
          period={period}
          selected={selectedDate[0]}
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
