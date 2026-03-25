import type { TransactionWithCategory } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { FormattedCurrency, Text } from '@/components/ui';
import { formatShortDate } from '@/features/formatting/helpers';
import { useAppStore } from '@/lib/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';

export type TransactionCardProps = {
  transaction: TransactionWithCategory;
  className?: string;
};

export const TransactionCard = React.memo(({ transaction, className }: TransactionCardProps) => {
  const router = useRouter();
  const theme = useThemeConfig();
  const currency = useAppStore.use.currency();
  const isIncome = transaction.type === 'income';
  const displayName = transaction.category_name || 'Unknown';
  const showConverted = transaction.currency !== currency;
  const bgColor = React.useMemo(
    () => `${transaction.category_color ?? '#90A4AE'}${theme.dark ? '10' : '20'}`,
    [transaction.category_color, theme.dark],
  );

  return (
    <Pressable className={cn('flex-row items-center gap-3 p-3', className)} onPress={() => router.push(`/transactions/${transaction.id}`)}>
      <View
        className="size-10 items-center justify-center rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        <Text className="text-xl font-medium" style={{ color: transaction.category_color || '#90A4AE' }}>
          {(transaction.category_icon || '?')}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium" numberOfLines={1}>
          {displayName}
        </Text>
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
          {formatShortDate(transaction.date)}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </Text>
      </View>
      <View className="items-end">
        <FormattedCurrency
          value={transaction.baseAmount}
          currency={transaction.baseCurrency}
          prefix={isIncome ? '+' : '-'}
          className={`text-base font-medium ${isIncome ? 'text-success-600' : ''}`}
        />
        {showConverted && (
          <FormattedCurrency value={transaction.amount} currency={transaction.currency} className="text-sm text-muted-foreground" />
        )}
      </View>
    </Pressable>
  );
});
