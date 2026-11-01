import type { PeriodProps } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { AmountText, Card, getPressedStyle, Text } from '@/components/ui';
import { ChevronRight, Sparkle } from '@/components/ui/icon';
import { setAiDraftQuestion } from '@/features/ai/store';
import { MonthBars } from '@/features/categories/components/month-bars';
import { averageOfLast, buildMonthBars, categoryIcon, categoryName, monthBarsRange, periodMonthName } from '@/features/categories/helpers';
import { useFormatMoney } from '@/features/categories/hooks';
import { formatDateFull, formatNumber } from '@/features/formatting/helpers';
import { useCategorySpendByRange, useSummaryByRange, useTrendByRange } from '@/features/insights/api';
import { buildTrendSeries } from '@/features/insights/trend';
import { buildTransactionsHref } from '@/features/transactions/route-params';
import { cn } from '@/lib/cn';
import { calendarDateToUnix, getPeriodRange, isNavigablePeriodMode, navigatePeriod } from '@/lib/date/helpers';
import { getPeriodLabel } from '@/lib/date/labels';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { selectIsAiFeatureOn, useAppStore } from '@/lib/store/store';
import { chartCeiling, dailyExpenses, elapsedSpendStats, monthlyFromDaily, monthlyGlobalBudget, savedRatio } from '../helpers';
import { useGlobalBudget } from '../hooks';

const DAY = 86400;
const MAX_DAILY_BARS = 62;
const CHART_HEIGHT = 96;

export function OverviewTab({ selection, startDate, endDate, onShowBudgets }: PeriodProps & { onShowBudgets: () => void }) {
  const month = periodMonthName(selection, startDate);
  const previous = isNavigablePeriodMode(selection.mode) ? navigatePeriod(selection, -1) : null;
  const [prevStart, prevEnd] = previous ? getPeriodRange(previous) : [undefined, undefined];
  const { data: summary } = useSummaryByRange(startDate, endDate);
  const { data: prevSummary } = useSummaryByRange(prevStart, prevEnd, !!previous);
  const spent = summary?.expense ?? 0;
  const prevSpent = previous && prevSummary ? prevSummary.expense : null;
  const isAiEnabled = useAppStore(selectIsAiFeatureOn('chat'));
  const prevLabels = previous && prevStart !== undefined
    ? (month ? { short: formatDateFull(prevStart, 'MMM'), long: formatDateFull(prevStart, 'MMMM') } : { short: getPeriodLabel(previous), long: getPeriodLabel(previous) })
    : null;

  return (
    <>
      <SpendHero
        title={month ? translate('stats.spent_in', { period: month }) : translate('stats.spent_period', { period: getPeriodLabel(selection) })}
        spent={spent}
        income={summary?.income ?? 0}
        prevSpent={prevSpent}
        prevLabel={prevLabels?.short}
        selection={selection}
        startDate={startDate}
        endDate={endDate}
      />
      <WhereItWent selection={selection} startDate={startDate} endDate={endDate} onShowBudgets={onShowBudgets} />
      <SixMonths month={month ? startDate : undefined} />
      {isAiEnabled && (
        <AskCard
          question={prevSpent != null && prevLabels && prevSpent !== spent
            ? translate(spent > prevSpent ? 'stats.ask_more' : 'stats.ask_less', { period: prevLabels.long })
            : translate('stats.ask_where', { period: month ?? getPeriodLabel(selection) })}
        />
      )}
    </>
  );
}

type HeroProps = PeriodProps & {
  title: string;
  spent: number;
  income: number;
  prevSpent: number | null;
  prevLabel: string | undefined;
};

function SpendHero({ title, spent, income, prevSpent, prevLabel, selection, startDate, endDate }: HeroProps) {
  const format = useFormatMoney();
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const { data: rows = [] } = useTrendByRange(startDate, endDate);
  const today = calendarDateToUnix(new Date());
  const stats = elapsedSpendStats(startDate, endDate, rows, today);
  const saved = savedRatio(income, spent);
  const percent = (ratio: number) => `${formatNumber(ratio * 100, numberFormat, 1)}%`;
  const delta = prevSpent != null ? spent - prevSpent : null;

  return (
    <Card variant="hero" className="mt-4 gap-3.5 p-5">
      <View className="flex-row items-end justify-between gap-2">
        <View className="shrink gap-0.5">
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>{title}</Text>
          <AmountText size="hero" value={spent} currency={currency} numberOfLines={1} adjustsFontSizeToFit />
        </View>
        {delta != null && prevSpent! > 0 && (
          <View className="items-end gap-0.5">
            <Text className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums', delta > 0 ? 'bg-negative/10 text-negative' : 'bg-positive/10 text-positive')}>
              {`${delta > 0 ? '▲' : '▼'} ${percent(Math.abs(delta) / prevSpent!)}`}
            </Text>
            <Text className="text-xs text-muted-foreground tabular-nums">
              {translate('stats.vs_period', { amount: `${delta > 0 ? '+' : '−'}${format(Math.abs(delta))}`, period: prevLabel })}
            </Text>
          </View>
        )}
      </View>
      <SpendBars selection={selection} startDate={startDate} endDate={endDate} rows={rows} today={today} />
      <View className="flex-row gap-2">
        <StatTile label={translate('stats.per_day')} value={format(stats.perDay)} />
        <StatTile label={translate('stats.zero_spend')} value={String(stats.zeroDays)} />
        <StatTile
          label={translate('stats.saved')}
          value={saved == null ? '—' : percent(saved)}
          className={saved == null ? undefined : saved >= 0 ? 'text-positive' : 'text-negative'}
        />
      </View>
    </Card>
  );
}

function StatTile({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <View className="flex-1 rounded-tile bg-card-2 px-3 py-2.5">
      <Text className="text-xs text-muted-foreground" numberOfLines={1}>{label}</Text>
      <Text className={cn('text-row font-semibold tabular-nums', className)} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

type Bar = { key: string; value: number; label: string; highlight: boolean };

function SpendBars({ selection, startDate, endDate, rows, today }: PeriodProps & { rows: Parameters<typeof buildTrendSeries>[3]; today: number }) {
  const format = useFormatMoney();
  const daily = startDate !== undefined && endDate !== undefined && (endDate - startDate) / DAY <= MAX_DAILY_BARS;
  const bars: Bar[] = daily
    ? dailyExpenses(startDate, endDate, rows).map((day, i) => ({
        key: String(day.date),
        value: day.value,
        label: i === 0 ? formatDateFull(day.date, 'MMM d') : formatDateFull(day.date, 'd'),
        highlight: day.date === today,
      }))
    : buildTrendSeries(selection.mode, startDate, endDate, rows).map((point, i, all) => ({
        key: `${point.label}-${i}`,
        value: point.expense,
        label: point.label,
        highlight: i === all.length - 1 && (endDate === undefined || today < endDate),
      }));
  if (bars.length === 0) return null;

  const ceiling = chartCeiling(bars.map((bar) => bar.value));
  const tallest = bars.reduce((max, bar) => (bar.value > max.value ? bar : max), bars[0]);
  const last = bars.length - 1;
  const ticks = [0, 7, 14, 21].filter((i) => i < last - 3).concat(last);

  return (
    <View className="gap-1.5">
      <View className="flex-row items-end justify-between gap-[3px] border-b border-border" style={{ height: CHART_HEIGHT }}>
        {bars.map((bar) => (
          <View
            key={bar.key}
            className={cn('max-w-6 flex-1 rounded-t-[3px]', bar.highlight ? 'bg-accent' : 'bg-track')}
            style={{ height: bar.value > 0 ? Math.max(4, (Math.min(bar.value, ceiling) / ceiling) * CHART_HEIGHT) : 2 }}
          />
        ))}
        {tallest.value > ceiling && (
          <Text className="absolute top-0 left-3 bg-card px-1 text-[11px] text-muted-foreground">
            {translate('stats.off_scale', { amount: format(tallest.value, 0) })}
          </Text>
        )}
      </View>
      <View className="flex-row justify-between">
        {ticks.map((i) => (
          <Text key={i} className={cn('text-[11px]', i === last ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{bars[i].label}</Text>
        ))}
      </View>
    </View>
  );
}

function WhereItWent({ selection, startDate, endDate, onShowBudgets }: PeriodProps & { onShowBudgets: () => void }) {
  const router = useRouter();
  const format = useFormatMoney();
  const numberFormat = useAppStore.use.numberFormat();
  const { data = [] } = useCategorySpendByRange(startDate, endDate);
  const items = data.filter((c) => c.expense_total > 0).sort((a, b) => b.expense_total - a.expense_total);
  const total = items.reduce((sum, c) => sum + c.expense_total, 0);
  if (total === 0) return null;

  return (
    <Card variant="hero" className="mt-3.5 gap-3.5 p-5">
      <View className="flex-row items-baseline justify-between">
        <Text accessibilityRole="header" className="text-base font-semibold">{translate('stats.where_it_went')}</Text>
        <Pressable accessibilityRole="button" onPress={onShowBudgets} hitSlop={8}>
          <Text className="text-meta text-muted-foreground">{translate('stats.budgets')}</Text>
        </Pressable>
      </View>
      <View accessible accessibilityLabel={translate('stats.split_label')} className="h-3 flex-row gap-0.5 overflow-hidden rounded-full">
        {items.map((c) => <View key={c.category_id} style={{ flex: c.expense_total, backgroundColor: c.category_color }} />)}
      </View>
      <View>
        {items.map((c) => (
          <Pressable
            key={c.category_id}
            accessibilityRole="button"
            onPress={() => router.push(buildTransactionsHref({ categoryIds: [c.category_id], type: 'expense', periodSelection: selection }))}
            style={getPressedStyle}
            className="h-10 flex-row items-center gap-2.5"
          >
            <View className="size-2.5 rounded-[3px]" style={{ backgroundColor: c.category_color }} />
            <Text className="flex-1 text-row" numberOfLines={1}>
              {`${categoryIcon(c.category_id, c.category_icon, c.category_name)} ${categoryName(c.category_id, c.category_name)}`}
            </Text>
            <Text className="w-[52px] text-right text-meta text-muted-foreground tabular-nums">
              {`${formatNumber((c.expense_total / total) * 100, numberFormat, 1)}%`}
            </Text>
            <Text className="min-w-[84px] text-right text-row font-semibold tabular-nums">{format(c.expense_total)}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

/** `month` is the start of the selected month Period; other Periods end at the current month. */
function SixMonths({ month }: { month: number | undefined }) {
  const format = useFormatMoney();
  const currentYearMonth = useCurrentYearMonth();
  const endYearMonth = month !== undefined ? new Date(month * 1000).toISOString().slice(0, 7) : currentYearMonth;
  const [start, end] = monthBarsRange(endYearMonth);
  const { data: rows = [] } = useTrendByRange(start, end);
  const { data: globalBudget } = useGlobalBudget();
  const bars = buildMonthBars(monthlyFromDaily(rows), endYearMonth, 'expense');
  const complete = bars.filter((bar) => bar.month < currentYearMonth);
  const average = averageOfLast(complete, complete.length);
  const budget = monthlyGlobalBudget(globalBudget) ?? undefined;
  const meta = [
    average > 0 && translate('stats.avg_amount', { amount: format(average, 0) }),
    budget && translate('stats.budget_amount', { amount: format(budget, 0) }),
  ].filter(Boolean).join(' · ');

  return (
    <Card variant="hero" className="mt-3.5 gap-3.5 p-5">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text accessibilityRole="header" className="text-base font-semibold">{translate('categories.last_six_months')}</Text>
        {!!meta && <Text className="shrink text-meta text-muted-foreground" numberOfLines={1}>{meta}</Text>}
      </View>
      <MonthBars bars={bars} budget={budget} />
    </Card>
  );
}

function AskCard({ question }: { question: string }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        setAiDraftQuestion(question);
        router.push('/ai');
      }}
      style={getPressedStyle}
      className="mt-3.5 flex-row items-center gap-3 rounded-card border border-accent-line bg-accent-soft px-4 py-3.5"
    >
      <View className="size-8 items-center justify-center rounded-full bg-primary">
        <Sparkle size={14} strokeWidth={2.5} colorClassName="accent-primary-foreground" />
      </View>
      <Text className="flex-1 text-row">{question}</Text>
      <ChevronRight size={18} colorClassName="accent-foreground" />
    </Pressable>
  );
}
