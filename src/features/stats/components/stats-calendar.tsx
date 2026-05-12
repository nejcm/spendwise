import type { DailyTrendTotal } from '@/features/insights/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  addDays,
  addMonths,
  endOfISOWeek,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfISOWeek,
  startOfMonth,
} from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import {
  FormattedCurrency,
  getPressedStyle,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { ChevronLeft, ChevronRight } from '@/components/ui/icon';
import { SkeletonBox } from '@/components/ui/skeleton';
import {
  trendByRangeQueryOptions,
  useTrendByRange,
} from '@/features/insights/api';
import { dateToUnix } from '@/lib/date/helpers';
import { useAppStore } from '@/lib/store/store';
import { expenseColor, incomeColor } from '@/lib/theme/colors';
import { StatsCalendarDayTooltip } from './stats-calendar-day-tooltip';

function isoDateKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function monthRange(monthStart: Date): [number, number] {
  return [dateToUnix(monthStart), dateToUnix(addMonths(monthStart, 1))];
}

type DayCell = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  income: number;
  expense: number;
};

const baseDayCls
  = 'm-0.5 flex-1 items-center justify-center rounded-lg px-0.25 py-1';

export function StatsCalendar() {
  const queryClient = useQueryClient();
  const db = useSQLiteContext();
  const currency = useAppStore.use.currency();

  const [currentMonth, setCurrentMonth] = React.useState<Date>(() =>
    startOfMonth(new Date()),
  );
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  const [monthStartUnix, monthEndUnix] = React.useMemo(
    () => monthRange(currentMonth),
    [currentMonth],
  );
  const { data, isLoading } = useTrendByRange(monthStartUnix, monthEndUnix);

  // Prefetch prev/next month for instant stepping.
  React.useEffect(() => {
    const [prevA, prevB] = monthRange(addMonths(currentMonth, -1));
    const [nextA, nextB] = monthRange(addMonths(currentMonth, 1));
    queryClient.prefetchQuery(trendByRangeQueryOptions(db, prevA, prevB));
    queryClient.prefetchQuery(trendByRangeQueryOptions(db, nextA, nextB));
  }, [currentMonth, db, queryClient]);

  const totalsByKey = React.useMemo(() => {
    const map = new Map<string, DailyTrendTotal>();
    for (const entry of data ?? []) {
      map.set(format(new Date(entry.date * 1000), 'yyyy-MM-dd'), entry);
    }
    return map;
  }, [data]);

  const days = React.useMemo<DayCell[]>(() => {
    const gridStart = startOfISOWeek(currentMonth);
    const gridEnd = endOfISOWeek(endOfMonth(currentMonth));
    const result: DayCell[] = [];
    for (
      let cursor = gridStart;
      cursor <= gridEnd;
      cursor = addDays(cursor, 1)
    ) {
      const totals = totalsByKey.get(isoDateKey(cursor));
      result.push({
        date: cursor,
        isCurrentMonth: isSameMonth(cursor, currentMonth),
        isToday: isToday(cursor),
        income: totals?.income ?? 0,
        expense: totals?.expense ?? 0,
      });
    }
    return result;
  }, [currentMonth, totalsByKey]);

  const selectedDay = selectedKey
    ? (days.find((d) => isoDateKey(d.date) === selectedKey) ?? null)
    : null;

  const goPrev = React.useCallback(() => {
    setSelectedKey(null);
    setCurrentMonth((m) => addMonths(m, -1));
  }, []);
  const goNext = React.useCallback(() => {
    setSelectedKey(null);
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  const weekdayLabels = React.useMemo(() => {
    // 5 Jan 2026 is a Monday — use that week to format weekday short labels.
    const monday = new Date(2026, 0, 5);
    return Array.from({ length: 7 }).map((_, i) =>
      format(addDays(monday, i), 'EEEEEE').toUpperCase(),
    );
  }, []);

  const rows = Math.ceil(days.length / 7);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 32,
        paddingBottom: 24,
      }}
    >
      <View>
        <View className="mb-8 flex-row items-center justify-between">
          <Pressable onPress={goPrev} hitSlop={12} className="p-1">
            <ChevronLeft className="text-foreground" size={20} />
          </Pressable>
          <Text className="text-base font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <Pressable onPress={goNext} hitSlop={12} className="p-1">
            <ChevronRight className="text-foreground" size={20} />
          </Pressable>
        </View>

        <View className="mb-2 flex-row">
          {weekdayLabels.map((label) => (
            <View key={label} className="flex-1 items-center">
              <Text className="text-xs text-muted-foreground">{label}</Text>
            </View>
          ))}
        </View>

        {isLoading && totalsByKey.size === 0
          ? (
              <SkeletonBox height={300} />
            )
          : (
              <View>
                {Array.from({ length: rows }).map((_, rowIdx) => (
                  <View key={rowIdx} className="flex-row">
                    {days.slice(rowIdx * 7, rowIdx * 7 + 7).map((day) => {
                      const key = isoDateKey(day.date);
                      const isSelected = selectedKey === key;
                      const diff = (day.income || 0) - (day.expense || 0);
                      return (
                        <Pressable
                          key={key}
                          onPress={() => {
                            if (!day.isCurrentMonth) return;
                            setSelectedKey(isSelected ? null : key);
                          }}
                          style={getPressedStyle}
                          className={`${baseDayCls} border ${isSelected ? 'border-primary' : day.isToday ? 'border-gray-500' : 'border-transparent'} ${day.isCurrentMonth ? '' : 'opacity-50'} min-h-13 bg-muted/40`}
                        >
                          <Text className="text-xs text-muted-foreground">
                            {day.date.getDate()}
                          </Text>
                          {day.isCurrentMonth && (
                            <FormattedCurrency
                              value={diff}
                              currency={currency}
                              numberOfLines={1}
                              className="mt-0.5 items-center text-[10px] font-bold"
                              style={{
                                color:
                              diff > 0
                                ? incomeColor
                                : diff === 0
                                  ? ''
                                  : expenseColor,
                              }}
                              shorten
                              negativeSymbol={false}
                              fractionDigits={1}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
      </View>

      {selectedDay && (
        <StatsCalendarDayTooltip
          date={selectedDay.date}
          income={selectedDay.income}
          expense={selectedDay.expense}
          currency={currency}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </ScrollView>
  );
}
