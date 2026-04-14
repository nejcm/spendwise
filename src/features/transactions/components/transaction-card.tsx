import type { TransactionWithCategory } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { DEFAULT_COLOR } from '@/components/color-selector';
import { FormattedCurrency, Text } from '@/components/ui';
import { formatShortDate } from '@/features/formatting/helpers';
import { useAppStore } from '@/lib/store/store';
import { hexWithOpacity } from '@/lib/theme/colors';

export type TransactionCardProps = {
  transaction: TransactionWithCategory;
  className?: string;
};

export const TransactionCard = React.memo(({ transaction, className }: TransactionCardProps) => {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const isIncome = transaction.type === 'income';
  const displayName = transaction.category_name || 'Unknown';
  const showConverted = transaction.currency !== currency;

  return (
    <Pressable className={cn('flex-row items-center gap-3 p-3', className)} onPress={() => router.push(`/transactions/${transaction.id}`)}>
      <View
        className="size-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: hexWithOpacity(transaction.category_color ?? DEFAULT_COLOR, 30) }}
      >
        <Text className="text-xl font-medium">
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
          value={transaction.amount}
          currency={transaction.currency}
          prefix={isIncome ? '+' : '-'}
          className={`text-base font-medium ${isIncome ? 'text-success-600' : ''}`}
        />
        {showConverted && (
          <FormattedCurrency value={transaction.baseAmount} currency={transaction.baseCurrency} className="text-sm text-muted-foreground" />
        )}
      </View>
    </Pressable>
  );
});
