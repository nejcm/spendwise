import type { TrendBar } from '../helpers';
import type { PeriodProps } from '../types';
import type { PeriodMode } from '@/lib/store/store';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { AmountText, Card, getPressedStyle, Text } from '@/components/ui';
import { getBudgetState } from '@/components/ui/budget-state';
import { Bot, ChevronRight } from '@/components/ui/icon';
import { setAiDraftQuestion } from '@/features/ai/store';
import { categoryIcon, categoryName, periodMonthName } from '@/features/categories/helpers';
import { useBudgetColors, useFormatMoney } from '@/features/categories/hooks';
import { formatDateFull, formatNumber } from '@/features/formatting/helpers';
import { useCategorySpendByRange, useSummaryByRange, useTrendByRange } from '@/features/insights/api';
import { buildTransactionsHref } from '@/features/transactions/route-params';
import { cn } from '@/lib/cn';
import { calendarDateToUnix, getPeriodRange, isNavigablePeriodMode, navigatePeriod } from '@/lib/date/helpers';
import { getPeriodLabel } from '@/lib/date/labels';
import { translate } from '@/lib/i18n';
import { selectIsAiFeatureOn, useAppStore } from '@/lib/store/store';
import { customRanges, elapsedSpendStats, monthlyGlobalBudget, savedRatio, trendBars, trendRanges } from '../helpers';
import { useGlobalBudget } from '../hooks';

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
    <Card variant="hero" className="mt-4 gap-4 p-5">
      <View className="mb-2 flex-row items-end justify-between gap-4">
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
      <PeriodTrend selection={selection} startDate={startDate} endDate={endDate} />
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

const TREND_LABEL_FORMAT: Record<Exclude<PeriodMode, 'custom'>, string> = {
  'all': 'yyyy',
  'year': 'yyyy',
  'this-year': 'yyyy',
  'month': 'MMM',
  'this-month': 'MMM',
  'week': 'MMM d',
  'this-week': 'MMM d',
  'day': 'EEE',
  'today': 'EEE',
};
const BUDGET_MONTHS: Partial<Record<PeriodMode, number>> = { 'month': 1, 'this-month': 1, 'year': 12, 'this-year': 12, 'all': 12 };
const DENSE_LABEL_FORMAT: Record<string, string> = { MMM: 'MMMMM', yyyy: '\'\'yy' };
const PAST_OPACITY = 0.4;

/** Income and expense for the selected Period and the five before it; a Custom Period is split into slices instead. */
function PeriodTrend({ selection, startDate, endDate }: Pick<PeriodProps, 'selection' | 'startDate' | 'endDate'>) {
  const format = useFormatMoney();
  const colors = useBudgetColors();
  const [width, setWidth] = React.useState(0);
  const isSplit = selection.mode === 'custom' && startDate !== undefined && endDate !== undefined;
  const { ranges, labelFormat } = isSplit
    ? customRanges(startDate, endDate)
    : { ranges: trendRanges(selection), labelFormat: TREND_LABEL_FORMAT[selection.mode as Exclude<PeriodMode, 'custom'>] };
  const { data: rows = [] } = useTrendByRange(ranges[0][0], ranges[ranges.length - 1][1]);
  const { data: globalBudget } = useGlobalBudget();
  const bars = trendBars(ranges, rows);
  const monthlyBudget = monthlyGlobalBudget(globalBudget);
  const budget = monthlyBudget && BUDGET_MONTHS[selection.mode] ? monthlyBudget * BUDGET_MONTHS[selection.mode]! : undefined;
  const today = calendarDateToUnix(new Date());
  const active = (isSplit ? bars.filter((bar) => bar.end <= today) : bars.slice(0, -1)).filter((bar) => bar.income > 0 || bar.expense > 0);
  const average = active.length > 0 ? Math.round(active.reduce((sum, bar) => sum + bar.expense, 0) / active.length) : 0;
  const max = Math.max(1, budget ?? 0, ...bars.flatMap((bar) => [bar.income, bar.expense]));
  const heightOf = (value: number) => (value > 0 ? Math.max(3, Math.round((value / max) * CHART_HEIGHT)) : 2);
  const last = bars.length - 1;
  const dense = bars.length > 7;
  const label = (bar: TrendBar, narrow = false) => formatDateFull(bar.start, (narrow && DENSE_LABEL_FORMAT[labelFormat]) || labelFormat);
  const gap = dense ? 'gap-1.5' : 'gap-3';
  const meta = [
    average > 0 && translate('stats.avg_amount', { amount: format(average, 0) }),
    budget && translate('stats.budget_amount', { amount: format(budget, 0) }),
  ].filter(Boolean).join(' · ');

  return (
    <View className="gap-2">
      <View
        accessible
        accessibilityLabel={bars.map((bar) => `${label(bar)}: ${translate('common.expenses')} ${format(bar.expense)}, ${translate('common.income')} ${format(bar.income)}`).join('; ')}
        className={cn('flex-row items-end border-b border-border', gap)}
        style={{ height: CHART_HEIGHT }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {bars.map((bar, i) => (
          <View key={bar.start} className="flex-1 flex-row items-end justify-center gap-0.75" style={{ opacity: isSplit || i === last ? 1 : PAST_OPACITY }}>
            <View className="max-w-4 flex-1 rounded-t-[3px]" style={{ height: heightOf(bar.expense), backgroundColor: i === last ? colors[getBudgetState(bar.expense, budget)] : colors.normal }} />
            <View className="max-w-4 flex-1 rounded-t-[3px]" style={{ height: heightOf(bar.income), backgroundColor: colors.muted }} />
          </View>
        ))}
        {!!budget && width > 0 && (
          <Svg pointerEvents="none" width={width} height={2} style={{ position: 'absolute', left: 0, bottom: heightOf(budget) - 1 }}>
            <Line x1={0} x2={width} y1={1} y2={1} stroke={colors.muted} strokeWidth={1.5} strokeDasharray="4 4" />
          </Svg>
        )}
      </View>
      <View className={cn('flex-row', gap)}>
        {bars.map((bar, i) => (
          <Text key={bar.start} className={cn('flex-1 text-center text-[11px]', i === last ? 'font-semibold text-foreground' : 'text-muted-foreground')} numberOfLines={1}>
            {label(bar, dense)}
          </Text>
        ))}
      </View>
      <View className="flex-row items-center gap-3">
        <LegendDot color={colors.normal} label={translate('common.expenses')} />
        <LegendDot color={colors.muted} label={translate('common.income')} />
        {!!meta && <Text className="flex-1 text-right text-[11px] text-muted-foreground" numberOfLines={1}>{meta}</Text>}
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="size-2 rounded-xs" style={{ backgroundColor: color }} />
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
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
    <Card variant="hero" className="mt-4 gap-4 p-5">
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
            <Text className="w-13 text-right text-meta text-muted-foreground tabular-nums">
              {`${formatNumber((c.expense_total / total) * 100, numberFormat, 1)}%`}
            </Text>
            <Text className="min-w-21 text-right text-row font-semibold tabular-nums">{format(c.expense_total)}</Text>
          </Pressable>
        ))}
      </View>
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
        <Bot size={14} strokeWidth={2.5} colorClassName="accent-primary-foreground" />
      </View>
      <Text className="flex-1 text-row">{question}</Text>
      <ChevronRight size={18} colorClassName="accent-foreground" />
    </Pressable>
  );
}
