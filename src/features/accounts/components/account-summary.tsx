import type { CurrencyKey } from '../../currencies';

import type { LoaderDimensions } from '@/components/ui/skeleton';
import * as React from 'react';
import { FormattedCurrency, Text, View } from '@/components/ui';
import { TrendingDown, TrendingUp } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useAccountSummaryByRange } from '@/features/accounts/api';
import { translate } from '@/lib/i18n';

export type AccountSummaryProps = {
  accountId: string | undefined;
  startDate: number | undefined;
  endDate: number | undefined;
  currency: CurrencyKey;
};

const loaderDimensions: LoaderDimensions = [['50%', 60], ['100%', 75]];

export function AccountSummary({ accountId, startDate, endDate, currency }: AccountSummaryProps) {
  const { data: summary, isLoading } = useAccountSummaryByRange(accountId, startDate, endDate);

  if (isLoading) {
    return (
      <SkeletonRows count={2} dimensions={loaderDimensions} className="mb-6 items-center justify-center px-4" />
    );
  }

  if (!summary) return null;
  return (
    <View className="mb-6 px-4">
      <FormattedCurrency value={summary.balance} currency={currency} className="pb-6 text-center text-3xl font-medium" />
      <View className="flex-row gap-2 rounded-xl bg-card p-4">
        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-center gap-2">
            <TrendingUp className="text-muted-foreground" size={16} />
            <Text className="text-center text-sm text-muted-foreground">{translate('common.income')}</Text>
          </View>
          <FormattedCurrency value={summary.income} currency={currency} className="text-center text-lg font-medium" numberOfLines={1} />
        </View>
        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-center gap-2">
            <TrendingDown className="text-muted-foreground" size={16} />
            <Text className="text-center text-sm text-muted-foreground">{translate('common.expenses')}</Text>
          </View>
          <FormattedCurrency value={summary.expense} currency={currency} prefix="- " className="text-center text-lg font-medium" numberOfLines={1} />
        </View>
      </View>
    </View>
  );
}
