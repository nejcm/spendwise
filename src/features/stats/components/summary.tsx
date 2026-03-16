import type { CurrencyKey } from '../../currencies';

import { TrendingDown, TrendingUp } from 'lucide-react-native';
import * as React from 'react';
import { Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { formatCurrency } from '../../formatting/helpers';

export type SummaryProps = {
  income: number;
  expense: number;
  balance: number;
  currency: CurrencyKey;
};

export function Summary({ income, expense, balance, currency }: SummaryProps) {
  return (
    <>
      <Text className="pb-6 text-center text-3xl font-medium">{formatCurrency(balance, currency)}</Text>
      <View className="mb-6 flex-row gap-2 rounded-xl bg-card p-4">
        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            <Text className="text-center text-sm text-muted-foreground">{translate('common.income')}</Text>
          </View>
          <Text className="text-center text-lg font-medium" numberOfLines={1}>
            {formatCurrency(income, currency)}
          </Text>
        </View>
        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-center gap-2">
            <TrendingDown className="size-4 text-muted-foreground" />
            <Text className="text-center text-sm text-muted-foreground">{translate('common.expenses')}</Text>
          </View>
          <Text className="text-center text-lg font-medium" numberOfLines={1}>
            -
            {' '}
            {formatCurrency(expense, currency)}
          </Text>
        </View>
      </View>
    </>
  );
}
