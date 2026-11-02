import type { PeriodProps } from '../types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useFormatMoney } from '@/features/categories/hooks';
import { formatDateFull, formatNumber } from '@/features/formatting/helpers';
import { useTrendByRange } from '@/features/insights/api';
import { useTransactions } from '@/features/transactions/api';
import { TransactionCard } from '@/features/transactions/components/transaction-card';
import { isTransferInLeg } from '@/features/transactions/queries';
import { cn } from '@/lib/cn';
import { calendarDateToUnix, getMonthBoundaries, monthOfDay, unixToDate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { dailyExpenses, heatLevels } from '../helpers';

const DAY = 86400;
// 5 Jan 2026 is a Monday.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => Date.UTC(2026, 0, 5 + i) / 1000);
const HEAT_CLASSES = ['bg-card-2', 'bg-accent/20', 'bg-accent/55', 'bg-accent'];

/** The month holding today when the Period does, else the Period's first month. */
function calendarMonth(startDate: number | undefined, endDate: number | undefined, today: number): [number, number] {
  const inPeriod = startDate === undefined || (today >= startDate && (endDate === undefined || today < endDate));
  const { year, month } = monthOfDay(inPeriod ? today : startDate);
  return getMonthBoundaries(year, month);
}

export function CalendarTab({ startDate, endDate }: PeriodProps) {
  const format = useFormatMoney();
  const numberFormat = useAppStore.use.numberFormat();
  const today = calendarDateToUnix(new Date());
  const [monthStart, monthEnd] = calendarMonth(startDate, endDate, today);
  const { data: rows = [] } = useTrendByRange(monthStart, monthEnd);
  const days = dailyExpenses(monthStart, monthEnd, rows);
  const levels = heatLevels(days.map((day) => day.value));
  const [picked, setPicked] = React.useState<number | null>(null);
  const selected = picked !== null && picked >= monthStart && picked < monthEnd
    ? picked
    : today >= monthStart && today < monthEnd ? today : monthStart;

  const leading = (unixToDate(monthStart).getUTCDay() + 6) % 7;
  const cells = [...Array.from({ length: leading }).fill(null) as null[], ...days.map((day, i) => ({ ...day, level: levels[i] }))];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const short = (value: number) => formatNumber(Math.round(value / 100), numberFormat, 0);

  return (
    <>
      <Card variant="hero" className="mt-4 gap-2 px-3.5 py-4">
        <View className="flex-row gap-1.25">
          {WEEKDAYS.map((day) => <Text key={day} className="flex-1 text-center text-xs text-muted-foreground">{formatDateFull(day, 'EEE')}</Text>)}
        </View>
        {weeks.map((week) => (
          <View key={week.find(Boolean)?.date} className="flex-row gap-1.25">
            {week.map((cell, i) => cell
              ? (
                  <Pressable
                    key={cell.date}
                    accessibilityRole="button"
                    accessibilityState={{ selected: cell.date === selected }}
                    accessibilityLabel={`${formatDateFull(cell.date, 'MMMM d')}, ${cell.value > 0 ? format(cell.value) : translate('stats.no_spending')}`}
                    onPress={() => setPicked(cell.date)}
                    className={cn(
                      'h-13 flex-1 items-center justify-center rounded-xl border-2',
                      HEAT_CLASSES[cell.level],
                      cell.date === selected ? 'border-foreground' : 'border-transparent',
                    )}
                  >
                    <Text className={cn('text-sm font-semibold', cell.level === 3 && 'text-accent-foreground')}>{unixToDate(cell.date).getUTCDate()}</Text>
                    <Text className={cn('text-[10px] tabular-nums opacity-85', cell.level === 3 && 'text-accent-foreground')} numberOfLines={1}>
                      {cell.value > 0 ? short(cell.value) : '—'}
                    </Text>
                  </Pressable>
                )
              : <View key={`blank-${i}`} className="flex-1" />)}
          </View>
        ))}
        <View className="flex-row items-center justify-end gap-1.5 pt-1">
          <Text className="text-xs text-muted-foreground">{translate('stats.less')}</Text>
          {HEAT_CLASSES.map((cls) => <View key={cls} className={cn('size-3.5 rounded-sm', cls)} />)}
          <Text className="text-xs text-muted-foreground">{translate('stats.more')}</Text>
        </View>
      </Card>
      <DayList day={selected} monthStart={monthStart} monthEnd={monthEnd} spent={days.find((d) => d.date === selected)?.value ?? 0} />
    </>
  );
}

function DayList({ day, monthStart, monthEnd, spent }: { day: number; monthStart: number; monthEnd: number; spent: number }) {
  const format = useFormatMoney();
  const { data = [] } = useTransactions(monthStart, monthEnd);
  const transactions = data.filter((t) => t.date >= day && t.date < day + DAY && !isTransferInLeg(t));

  return (
    <>
      <View className="flex-row items-baseline justify-between pt-5.5 pb-1">
        <Text accessibilityRole="header" className="text-header-title font-semibold">{formatDateFull(day, 'EEEE, MMM d')}</Text>
        {spent > 0 && <Text className="text-sm text-muted-foreground tabular-nums">{translate('stats.spent_amount', { amount: format(spent) })}</Text>}
      </View>
      {transactions.length === 0
        ? <Text className="py-6 text-center text-meta text-muted-foreground">{translate('stats.nothing_on_day')}</Text>
        : transactions.map((t) => <TransactionCard key={t.id} transaction={t} className="px-0" />)}
    </>
  );
}
