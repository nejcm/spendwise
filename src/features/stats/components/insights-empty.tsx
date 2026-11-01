import type { PeriodProps } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { AmountText, Card, SolidButton, Text } from '@/components/ui';
import { Lock } from '@/components/ui/icon';
import { buildMonthBars, monthBarsRange, periodMonthName } from '@/features/categories/helpers';
import { formatDateFull } from '@/features/formatting/helpers';
import { useSummaryByRange, useTrendByRange } from '@/features/insights/api';
import { cn } from '@/lib/cn';
import { getPeriodLabel } from '@/lib/date/labels';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { INSIGHTS_MIN_TRANSACTIONS, monthlyFromDaily } from '../helpers';

const CHART_HEIGHT = 56;
const LOCKED = ['stats.empty.locked_where', 'stats.empty.locked_daily', 'stats.empty.locked_months'] as const;

/** Overview before there are `INSIGHTS_MIN_TRANSACTIONS` income/expense transactions. */
export function InsightsEmpty({ count, selection, startDate, endDate }: PeriodProps & { count: number }) {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const month = periodMonthName(selection, startDate);
  const { data: summary } = useSummaryByRange(startDate, endDate);

  return (
    <>
      <Card variant="hero" className="mt-4 gap-3.5 p-5">
        <View className="gap-0.5">
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {month ? translate('stats.spent_in', { period: month }) : translate('stats.spent_period', { period: getPeriodLabel(selection) })}
          </Text>
          <AmountText size="hero" value={summary?.expense ?? 0} currency={currency} numberOfLines={1} adjustsFontSizeToFit />
        </View>
        <BaselineChart month={month ? startDate : undefined} />
      </Card>
      <Card variant="hero" className="mt-3 gap-3 px-5 py-[18px]">
        <View className="flex-row items-center justify-between gap-2">
          <Text accessibilityRole="header" className="text-[17px] font-semibold">{translate('stats.empty.title')}</Text>
          <Text className="text-meta text-muted-foreground tabular-nums">
            {translate('stats.empty.progress', { count, total: INSIGHTS_MIN_TRANSACTIONS })}
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={translate('stats.empty.progress_label')}
          accessibilityValue={{ min: 0, max: INSIGHTS_MIN_TRANSACTIONS, now: count }}
          className="h-1.5 overflow-hidden rounded-full bg-track"
        >
          <View className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(count / INSIGHTS_MIN_TRANSACTIONS, 1) * 100}%` }} />
        </View>
        <Text className="text-sm/snug text-muted-foreground">{translate('stats.empty.body', { total: INSIGHTS_MIN_TRANSACTIONS })}</Text>
        <View className="flex-row gap-2">
          <SolidButton
            color="primary"
            size="lg"
            className="flex-1 rounded-full"
            textClassName="font-semibold"
            label={translate('stats.empty.add')}
            onPress={() => router.push('/transactions/new')}
          />
          <SolidButton
            color="secondary"
            size="lg"
            className="flex-1 rounded-full"
            label={translate('stats.empty.import')}
            onPress={() => router.push('/settings/import-export')}
          />
        </View>
      </Card>
      <Text accessibilityRole="header" className="pt-5 pb-1.5 text-meta font-medium text-muted-foreground">{translate('stats.empty.unlocks')}</Text>
      {LOCKED.map((key) => (
        <View key={key} className="min-h-[46px] flex-row items-center gap-3">
          <View className="size-8 items-center justify-center rounded-[10px] bg-card">
            <Lock size={15} colorClassName="accent-muted-foreground" />
          </View>
          <Text className="flex-1 text-row text-muted-foreground">{translate(key)}</Text>
        </View>
      ))}
    </>
  );
}

/** Six months ending at `month` (or the current month) on a zero baseline. */
function BaselineChart({ month }: { month: number | undefined }) {
  const currentYearMonth = useCurrentYearMonth();
  const endYearMonth = month !== undefined ? new Date(month * 1000).toISOString().slice(0, 7) : currentYearMonth;
  const [start, end] = monthBarsRange(endYearMonth);
  const { data: rows = [] } = useTrendByRange(start, end);
  const bars = buildMonthBars(monthlyFromDaily(rows), endYearMonth, 'expense');
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  const last = bars.length - 1;

  return (
    <View accessible accessibilityLabel={translate('stats.empty.chart_label')} className="gap-1.5">
      <View className="flex-row items-end gap-2.5 border-b border-border" style={{ height: CHART_HEIGHT }}>
        {bars.map((bar, i) => (
          <View
            key={bar.month}
            className={cn('flex-1 rounded-t-lg rounded-b-[2px]', i === last ? 'bg-accent' : 'bg-track')}
            style={{ height: bar.value > 0 ? Math.max(4, (bar.value / max) * CHART_HEIGHT) : 0 }}
          />
        ))}
      </View>
      <View className="flex-row gap-2.5">
        {bars.map((bar, i) => (
          <Text key={bar.month} className={cn('flex-1 text-center text-xs', i === last ? 'text-foreground' : 'text-muted-foreground')}>
            {formatDateFull(bar.start, 'MMM')}
          </Text>
        ))}
      </View>
    </View>
  );
}
