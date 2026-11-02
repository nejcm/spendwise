import type { BudgetOutlook } from '../helpers';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { FormattedCurrency, getPressedStyle, Text, useModalSheet } from '@/components/ui';
import { ChevronRight } from '@/components/ui/icon';
import { formatCurrency, formatShortDate, todayUnix } from '@/features/formatting/helpers';
import { committedForMonth } from '@/features/scheduled-transactions/helpers';
import { useScheduledTransactions, useToPreferred } from '@/features/scheduled-transactions/hooks';
import { BudgetSheet } from '@/features/stats/components/budget-sheet';
import { daysLeftIn, getBudgetSelectionBoundaries, scaleGlobalBudget } from '@/features/stats/helpers';
import { useBillSpend, useGlobalBudget, useGlobalBudgetSpend } from '@/features/stats/hooks';
import { cn } from '@/lib/cn';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { budgetOutlook, monthName } from '../helpers';

const DAY = 86_400;

const STATE_CLASSES: Record<BudgetOutlook['state'], { ink: string; bar: string }> = {
  on_track: { ink: 'text-positive', bar: 'bg-accent' },
  fast: { ink: 'text-warning-700 dark:text-warning-400', bar: 'bg-warning-500 dark:bg-warning-400' },
  over: { ink: 'text-negative', bar: 'bg-negative' },
};

function endsLabel(daysLeft: number) {
  if (daysLeft === 0) return translate('home.budget.ends_today');
  if (daysLeft === 1) return translate('home.budget.ends_tomorrow');
  return translate('home.budget.days_left', { count: daysLeft });
}

export function MonthBudgetCard() {
  const yearMonth = useCurrentYearMonth();
  const [year, month] = yearMonth.split('-').map(Number);
  const selection = { mode: 'month', year, month } as const;
  const [startDate, endDate] = getBudgetSelectionBoundaries(selection);
  const { data: budget } = useGlobalBudget();
  const limit = budget ? scaleGlobalBudget(budget, selection) : 0;
  const sheet = useModalSheet();
  const title = translate('home.budget.title', { month: monthName(month - 1) });

  return (
    <>
      {limit > 0
        ? <BudgetOutlookCard title={title} limit={limit} startDate={startDate} endDate={endDate} yearMonth={yearMonth} onPress={() => sheet.present()} />
        : (
            <Pressable accessibilityRole="button" onPress={() => sheet.present()} style={getPressedStyle} className="mt-4 flex-row items-center justify-between gap-2 rounded-card bg-card px-5 py-4">
              <View className="gap-1">
                <Text className="text-row font-semibold" numberOfLines={1}>{title}</Text>
                <Text className="text-meta text-muted-foreground">{translate('home.budget.set')}</Text>
              </View>
              <ChevronRight size={24} colorClassName="accent-muted-foreground" />
            </Pressable>
          )}
      <BudgetSheet ref={sheet.ref} />
    </>
  );
}

type BudgetOutlookCardProps = { title: string; limit: number; startDate: number; endDate: number; yearMonth: string; onPress: () => void };

function BudgetOutlookCard({ title, limit, startDate, endDate, yearMonth, onPress }: BudgetOutlookCardProps) {
  const { data: spent = 0 } = useGlobalBudgetSpend(startDate, endDate);
  const { data: billsPaid = 0 } = useBillSpend(startDate, endDate);
  const { data: rules = [] } = useScheduledTransactions();
  const toPreferred = useToPreferred();
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const money = (cents: number) => formatCurrency(cents, currency, { numberFormat, currencyFormat });

  const billsComing = React.useMemo(() => committedForMonth(rules, yearMonth, toPreferred).bills, [rules, yearMonth, toPreferred]);
  const daysAfterToday = daysLeftIn(startDate, endDate, todayUnix()) ?? 0;
  const outlook = budgetOutlook({ limit, spent, billsPaid, billsComing, daysLeft: daysAfterToday + 1, totalDays: Math.round((endDate - startDate) / DAY) });
  const classes = STATE_CLASSES[outlook.state];
  const everyday = Math.max(spent - billsPaid, 0);
  const scale = Math.max(limit, spent + billsComing);
  const width = (cents: number) => `${(cents / scale) * 100}%` as const;

  const status = outlook.state === 'on_track'
    ? translate('home.budget.on_track')
    : outlook.state === 'fast' ? translate('home.budget.over_pace', { amount: money(outlook.overPace) }) : translate('home.budget.over_budget');
  const detail = outlook.state === 'on_track'
    ? translate('home.budget.detail_on_track', { date: formatShortDate(endDate - DAY) })
    : outlook.state === 'fast'
      ? translate('home.budget.detail_fast', { amount: money(outlook.plannedPerDay) })
      : billsComing > 0 ? translate('home.budget.detail_over_coming', { amount: money(billsComing) }) : null;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={getPressedStyle} className="mt-4 gap-3 rounded-card bg-card px-5 py-4.5">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="shrink text-row font-semibold" numberOfLines={1}>{title}</Text>
        <Text className="text-meta text-muted-foreground">{endsLabel(daysAfterToday)}</Text>
      </View>
      <View className="gap-1">
        <View className="flex-row items-baseline gap-1.5">
          <FormattedCurrency
            value={outlook.state === 'over' ? outlook.over : outlook.perDay}
            currency={currency}
            numberOfLines={1}
            adjustsFontSizeToFit
            className={cn('shrink text-[34px]/9.5 font-bold tracking-tight tabular-nums', outlook.state === 'over' && 'text-negative')}
          />
          <Text className="text-[15px] text-muted-foreground">{outlook.state === 'over' ? translate('common.over') : translate('home.budget.a_day')}</Text>
        </View>
        <View className="flex-row items-start gap-2">
          <View className={cn('mt-1.5 size-2 rounded-full', classes.bar)} />
          <Text className="shrink text-meta/4.5 text-foreground-2">
            <Text className={cn('text-[13px] font-semibold', classes.ink)}>{status}</Text>
            {detail && ` · ${detail}`}
          </Text>
        </View>
      </View>
      <View className="gap-2">
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={translate('home.budget.bar_label', { bills: money(billsPaid), everyday: money(everyday), coming: money(billsComing), left: money(outlook.left) })}
          className="h-2.5 flex-row gap-0.5 overflow-hidden rounded-full bg-track"
        >
          {billsPaid > 0 && <View className="bg-muted-foreground" style={{ width: width(billsPaid) }} />}
          {everyday > 0 && <View className={classes.bar} style={{ width: width(everyday) }} />}
          {billsComing > 0 && <View className="min-w-1 bg-accent-line" style={{ width: width(billsComing) }} />}
        </View>
        <View className="flex-row justify-between gap-3">
          <Text className="text-meta text-muted-foreground tabular-nums">{translate('home.budget.spent_amount', { amount: money(spent) })}</Text>
          <Text className="text-meta font-medium text-foreground-2 tabular-nums">
            {outlook.state === 'over' ? translate('home.budget.of_budget', { budget: money(limit) }) : translate('home.budget.left_amount', { amount: money(outlook.left) })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
