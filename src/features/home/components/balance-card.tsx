import type { UniwindLucideIcon } from '@/components/ui/icon';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { View } from 'react-native';
import { AmountText, Card, FlagCircle, Text } from '@/components/ui';
import { ArrowDownRight, ArrowUpRight } from '@/components/ui/icon';
import { useBalanceSeries } from '@/features/accounts/api';
import { SHORTEN_TIGHT } from '@/features/formatting/constants';
import { todayUnix } from '@/features/formatting/helpers';
import { useMonthSummary } from '@/features/transactions/api';
import { cn } from '@/lib/cn';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { buildDailyBalances, monthName } from '../helpers';
import { BalanceLine } from './balance-line';

export function BalanceCard({ isEmpty }: { isEmpty: boolean }) {
  const currency = useAppStore.use.currency();
  const showLine = useAppStore.use.homeScreenChart() === 'balance' && !isEmpty;

  return (
    <Card variant="hero" className={cn('px-5 pt-5', showLine ? 'pb-0' : 'pb-5')}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="shrink text-sm text-muted-foreground" numberOfLines={1}>
          {translate('accounts.net_this_month')}
        </Text>
        <View className="flex-row items-center gap-1.5 rounded-full bg-card-2 py-1 pr-2.5 pl-1">
          <FlagCircle currency={currency} size={18} />
          <Text className="text-xs font-semibold">{currency}</Text>
        </View>
      </View>
      {isEmpty
        ? (
            <>
              <AmountText size="hero" value={0} currency={currency} className="pt-2.5" />
              <View className="mt-4.5 border-t-[1.5px] border-dashed border-track pt-3">
                <Text className="text-sm text-muted-foreground">{translate('home.balance_line_empty')}</Text>
              </View>
            </>
          )
        : <BalanceTrend showLine={showLine} />}
    </Card>
  );
}

function BalanceTrend({ showLine }: { showLine: boolean }) {
  const currency = useAppStore.use.currency();
  const yearMonth = useCurrentYearMonth();
  const month = Number(yearMonth.slice(5)) - 1;
  const [startDate, endDate] = getCurrentMonthRange(yearMonth);
  const { data: series } = useBalanceSeries(startDate, endDate);
  const { data: summary } = useMonthSummary(yearMonth);
  const net = series ? series.deltas.reduce((sum, { delta }) => sum + delta, 0) - series.adjusted : 0;
  const values = React.useMemo(
    () => series ? buildDailyBalances(series.opening, series.deltas, startDate, todayUnix()) : [],
    [series, startDate],
  );

  return (
    <>
      <AmountText size="hero" value={net} prefix={net > 0 ? '+' : ''} currency={currency} className={cn('pt-2.5', net > 0 && 'text-positive')} numberOfLines={1} adjustsFontSizeToFit />
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

const TONE_CLASSES = {
  positive: { tile: 'bg-positive/12', icon: 'accent-positive' },
  negative: { tile: 'bg-negative/12', icon: 'accent-negative' },
};

type SummaryFigureProps = { label: string; value: number; currency: CurrencyKey; icon: UniwindLucideIcon; tone: keyof typeof TONE_CLASSES };

function SummaryFigure({ label, value, currency, icon: Icon, tone }: SummaryFigureProps) {
  return (
    <View accessible accessibilityLabel={label} className={cn('shrink flex-row items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1.5', TONE_CLASSES[tone].tile)}>
      <Icon size={14} strokeWidth={2.2} colorClassName={TONE_CLASSES[tone].icon} />
      <AmountText value={value} currency={currency} shorten={SHORTEN_TIGHT} numberOfLines={1} className="shrink text-sm font-medium" />
    </View>
  );
}
