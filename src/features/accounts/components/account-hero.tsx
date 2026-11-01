import type { Account } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { AmountText, Card, FormattedCurrency, IconTile, Text } from '@/components/ui';
import { SkeletonRows } from '@/components/ui/skeleton';
import { formatCurrency, formatShortDate, todayUnix } from '@/features/formatting/helpers';
import { BalanceLine } from '@/features/home/components/balance-line';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { useAccountFlows, useBalanceSeries } from '../api';
import { summarizeBalance } from '../helpers';
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS } from '../types';

type AccountHeroProps = {
  account: Account;
  startDate: number | undefined;
  endDate: number | undefined;
};

export function AccountHero({ account, startDate, endDate }: AccountHeroProps) {
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const { data: series } = useBalanceSeries(startDate ?? 0, endDate ?? Number.MAX_SAFE_INTEGER, account.id);
  const { data: flows } = useAccountFlows(account.id, startDate, endDate);
  const summary = React.useMemo(() => series && summarizeBalance(series, startDate, endDate, todayUnix()), [series, startDate, endDate]);
  const budget = account.budget
    ? translate('accounts.budget_per_month', { amount: formatCurrency(account.budget, currency, { numberFormat, currencyFormat, fractionDigits: account.budget % 100 ? 2 : 0 }) })
    : null;
  const endLabel = summary && (summary.lastDay === todayUnix() ? translate('common.today') : formatShortDate(summary.lastDay));

  return (
    <Card variant="hero" className="mt-5 gap-4 p-5">
      <View className="flex-row items-center gap-3">
        <IconTile size="lg" icon={account.icon || '💵'} color={account.color ?? ACCOUNT_TYPE_COLORS[account.type]} />
        <View className="min-w-0 flex-1">
          <Text accessibilityRole="header" className="text-lg font-semibold" numberOfLines={1}>{account.name}</Text>
          <Text className="text-meta text-muted-foreground" numberOfLines={2}>
            {[ACCOUNT_TYPE_LABELS[account.type], account.currency, budget].filter(Boolean).join(' · ')}
          </Text>
          {!!account.description && <Text className="text-meta text-muted-foreground italic" numberOfLines={1}>{account.description}</Text>}
        </View>
      </View>

      {!summary || !flows
        ? <SkeletonRows count={3} />
        : (
            <>
              <AmountText size="hero" value={summary.closing} currency={currency} numberOfLines={1} adjustsFontSizeToFit />
              {summary.values.length > 1 && (
                <View className="gap-1">
                  <BalanceLine
                    testID="account-balance-line"
                    values={summary.values}
                    lowIndex={summary.low.index}
                    height={76}
                    accessibilityLabel={translate('accounts.balance_chart_label', { start: formatShortDate(summary.start), end: endLabel })}
                  />
                  <View className="flex-row justify-between">
                    <Text className="text-[11px] text-muted-foreground">{formatShortDate(summary.start)}</Text>
                    <Text className="text-[11px] text-muted-foreground">{endLabel}</Text>
                  </View>
                </View>
              )}
              <View className="flex-row gap-2">
                <FlowTile label={translate('accounts.flow_in')} value={flows.income} prefix="+" className="text-positive" />
                <FlowTile label={translate('accounts.flow_spent')} value={flows.expense} prefix="-" />
                <FlowTile label={translate('accounts.flow_moved_out')} value={flows.movedOut} prefix="-" />
              </View>
              <Text className="text-meta text-muted-foreground">
                {`${translate('accounts.started_at')} `}
                <FormattedCurrency value={summary.opening} currency={currency} className="text-foreground" />
                {` · ${translate('accounts.low_of')} `}
                <FormattedCurrency value={summary.low.value} currency={currency} className="text-foreground" />
                {` ${translate('accounts.low_on', { date: formatShortDate(summary.low.date) })}`}
              </Text>
            </>
          )}
    </Card>
  );
}

function FlowTile({ label, value, prefix, className }: { label: string; value: number; prefix: string; className?: string }) {
  const currency = useAppStore.use.currency();
  return (
    <View className="min-w-0 flex-1 rounded-tile bg-card-2 px-3 py-2.5">
      <Text className="text-xs text-muted-foreground" numberOfLines={1}>{label}</Text>
      <FormattedCurrency
        value={value}
        currency={currency}
        prefix={value ? prefix : ''}
        className={cn('text-row font-semibold', value ? className : undefined)}
        numberOfLines={1}
        adjustsFontSizeToFit
      />
    </View>
  );
}
