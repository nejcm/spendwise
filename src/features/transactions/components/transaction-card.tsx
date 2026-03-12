import type { TransactionWithCategory } from '../types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency, formatShortDate } from '@/features/formatting/helpers';
import { useAppStore } from '@/lib/store';

export type TransactionCardProps = {
  transaction: TransactionWithCategory;
  onPress?: () => void;
};

export const TransactionCard = React.memo(({ transaction, onPress }: TransactionCardProps) => {
  const currency = useAppStore.use.currency();
  const isIncome = transaction.type === 'income';
  const displayName = transaction.category_name || 'Unknown';

  return (
    <Pressable className="flex-row items-center gap-2 p-3" onPress={onPress}>
      <View
        className="size-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${transaction.category_color || '#90A4AE'}20`,
        }}
      >
        <Text className="text-lg font-medium" style={{ color: transaction.category_color || '#90A4AE' }}>
          {(transaction.category_icon || '?')}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium" numberOfLines={1}>
          {displayName}
        </Text>
        <Text className="text-sm text-neutral-500" numberOfLines={1}>
          {formatShortDate(transaction.date)}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </Text>
      </View>
      <Text
        className={`text-base font-medium ${isIncome ? 'text-success-600' : 'text-neutral-900 dark:text-neutral-100'}`}
      >
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount, currency)}
      </Text>
    </Pressable>
  );
});
