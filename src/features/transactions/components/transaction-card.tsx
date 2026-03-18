import type { TransactionWithCategory } from '../types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { Text } from '@/components/ui';
import { formatCurrency, formatShortDate } from '@/features/formatting/helpers';
import { useAppStore } from '@/lib/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';

export type TransactionCardProps = {
  transaction: TransactionWithCategory;
  onPress?: () => void;
  className?: string;
};

export const TransactionCard = React.memo(({ transaction, onPress, className }: TransactionCardProps) => {
  const theme = useThemeConfig();
  const currency = useAppStore.use.currency();
  const isIncome = transaction.type === 'income';
  const displayName = transaction.category_name || 'Unknown';

  return (
    <Pressable className={cn('flex-row items-center gap-3 p-3', className)} onPress={onPress}>
      <View
        className="size-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${transaction.category_color || '#90A4AE'}${theme.dark ? '10' : '20'}`,
        }}
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
      <Text
        className={`text-base font-medium ${isIncome ? 'text-success-600' : 'text-gray-900 dark:text-gray-100'}`}
      >
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount, currency)}
      </Text>
    </Pressable>
  );
});
