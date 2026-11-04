import type { UniwindLucideIcon } from '@/components/ui/icon';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { View } from 'react-native';
import { AmountText, Card, FlagCircle, Text } from '@/components/ui';
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight } from '@/components/ui/icon';
import { useBalanceSeries } from '@/features/accounts/api';
import { SHORTEN_TIGHT } from '@/features/formatting/constants';
import { formatNumber, todayUnix } from '@/features/formatting/helpers';
import { useMonthSummary } from '@/features/transactions/api';
import { cn } from '@/lib/cn';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { buildDailyBalances, monthName, percentChange } from '../helpers';
import { BalanceLine } from './balance-line';

type BalanceCardProps = {
  total: number;
  accountCount: number;
  isEmpty: boolean;
};

export function BalanceCard({ total, accountCount, isEmpty }: BalanceCardProps) {
  const currency = useAppStore.use.currency();
  const showLine = useAppStore.use.homeScreenChart() === 'balance' && !isEmpty;

  return (
    <Card variant="hero" className={cn('px-5 pt-5', showLine ? 'pb-0' : 'pb-5')}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="shrink text-sm text-muted-foreground" numberOfLines={1}>
          {accountCount === 1 ? translate('home.total_balance_one') : translate('home.total_balance_many', { count: accountCount })}
        </Text>
        <View className="flex-row items-center gap-1.5 rounded-full bg-card-2 py-1 pr-2.5 pl-1">
          <FlagCircle currency={currency} size={18} />
          <Text className="text-xs font-semibold">{currency}</Text>
        </View>
      </View>
      {isEmpty
        ? (
            <>
              <AmountText size="hero" value={total} currency={currency} className="pt-2.5" />
              <View className="mt-4.5 border-t-[1.5px] border-dashed border-track pt-3">
                <Text className="text-sm text-muted-foreground">{translate('home.balance_line_empty')}</Text>
              </View>
            </>
          )
        : <BalanceTrend total={total} showLine={showLine} />}
    </Card>
  );
}

function BalanceTrend({ total, showLine }: { total: number; showLine: boolean }) {
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const yearMonth = useCurrentYearMonth();
  const month = Number(yearMonth.slice(5)) - 1;
  const [startDate, endDate] = getCurrentMonthRange(yearMonth);
  const { data: series } = useBalanceSeries(startDate, endDate);
  const { data: summary } = useMonthSummary(yearMonth);
  const change = series ? percentChange(total, series.opening) : null;
  const values = React.useMemo(
    () => series ? buildDailyBalances(series.opening, series.deltas, startDate, todayUnix()) : [],
    [series, startDate],
  );
  const tone = CHANGE_TONE[!change ? 'flat' : change > 0 ? 'up' : 'down'];
  const Arrow = !change ? null : change > 0 ? ArrowUp : ArrowDown;

  return (
    <>
      <View className="flex-row items-end justify-between gap-2 pt-2.5">
        <AmountText size="hero" value={total} currency={currency} className="shrink" numberOfLines={1} adjustsFontSizeToFit />
        {change !== null && (
          <View className="items-end gap-0.5 pb-0.5">
            <View className={cn('flex-row items-center gap-0.5 rounded-full border px-1.5 py-0.5', tone.badge)}>
              {Arrow && <Arrow size={11} colorClassName={tone.icon} />}
              <Text className={cn('text-xs tabular-nums', tone.text)}>
                {`${change === 0 ? '±' : ''}${formatNumber(Math.abs(change), numberFormat, 1)}%`}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">{translate('home.vs_end_of', { month: monthName((month + 11) % 12) })}</Text>
          </View>
        )}
      </View>
      {!!(summary?.income || summary?.expense) && (
        <View className="mt-3 flex-row gap-3">
          <SummaryFigure label={translate('common.income')} value={summary.income} currency={currency} icon={ArrowUpRight} tone="positive" />
          <SummaryFigure label={translate('common.expenses')} value={summary.expense} currency={currency} icon={ArrowDownRight} tone="negative" />
        </View>
      )}
      {showLine && (
        <View className="-mx-5 mt-3.5">
          <BalanceLine values={values} accessibilityLabel={translate('home.balance_chart_label', { month: monthName(month) })} />
        </View>
      )}
    </>
  );
}

// A rising balance is good news, unlike rising spend on the insights badge.
const CHANGE_TONE = {
  up: { badge: 'border-positive/25 bg-positive/10', text: 'text-positive', icon: 'accent-positive' },
  down: { badge: 'border-negative/25 bg-negative/10', text: 'text-negative', icon: 'accent-negative' },
  flat: { badge: 'border-muted-foreground/25 bg-muted-foreground/10', text: 'text-muted-foreground', icon: 'accent-muted-foreground' },
};

const TONE_CLASSES = {
  positive: { tile: 'bg-positive/12', icon: 'accent-positive' },
  negative: { tile: 'bg-negative/12', icon: 'accent-negative' },
};

type SummaryFigureProps = { label: string; value: number; currency: CurrencyKey; icon: UniwindLucideIcon; tone: keyof typeof TONE_CLASSES };

function SummaryFigure({ label, value, currency, icon: Icon, tone }: SummaryFigureProps) {
  return (
    <View accessible accessibilityLabel={label} className={cn('shrink flex-row items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1.5', TONE_CLASSES[tone].tile)}>
      <Icon size={14} strokeWidth={2.2} colorClassName={TONE_CLASSES[tone].icon} />
      <AmountText value={value} currency={currency} shorten={SHORTEN_TIGHT} numberOfLines={1} className="shrink text-sm" />
    </View>
  );
}
