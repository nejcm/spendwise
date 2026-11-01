import { format } from 'date-fns';
import * as React from 'react';
import { View } from 'react-native';
import { AmountText, Card, FlagCircle, Text } from '@/components/ui';
import { useBalanceSeries } from '@/features/accounts/api';
import { formatNumber, todayUnix } from '@/features/formatting/helpers';
import { cn } from '@/lib/cn';
import { getCurrentMonthRange } from '@/lib/date/helpers';
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
              <View className="mt-[18px] border-t-[1.5px] border-dashed border-track pt-3">
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
  const now = new Date();
  const [startDate, endDate] = React.useMemo(() => getCurrentMonthRange(format(new Date(), 'yyyy-MM')), []);
  const { data: series } = useBalanceSeries(startDate, endDate);
  const change = series ? percentChange(total, series.opening) : null;
  const values = React.useMemo(
    () => series ? buildDailyBalances(series.opening, series.deltas, startDate, todayUnix()) : [],
    [series, startDate],
  );
  const isUp = (change ?? 0) >= 0;

  return (
    <>
      <View className="flex-row items-end justify-between gap-2 pt-2.5">
        <AmountText size="hero" value={total} currency={currency} className="shrink" numberOfLines={1} adjustsFontSizeToFit />
        {change !== null && (
          <View className="items-end gap-0.5 pb-0.5">
            <Text className={cn('rounded-md px-[7px] py-0.5 text-xs font-semibold tabular-nums', isUp ? 'bg-positive/15 text-positive dark:bg-accent dark:text-accent-foreground' : 'bg-negative/15 text-negative')}>
              {`${isUp ? '▲' : '▼'} ${formatNumber(Math.abs(change), numberFormat, 1)}%`}
            </Text>
            <Text className="text-xs text-muted-foreground">{translate('home.vs_end_of', { month: monthName((now.getMonth() + 11) % 12) })}</Text>
          </View>
        )}
      </View>
      {showLine && (
        <View className="-mx-5 mt-3.5">
          <BalanceLine values={values} accessibilityLabel={translate('home.balance_chart_label', { month: monthName(now.getMonth()) })} />
        </View>
      )}
    </>
  );
}
