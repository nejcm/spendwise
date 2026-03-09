import type { TransactionWithCategory } from '../types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency } from '@/lib/format';

import { getCurrency } from '@/lib/hooks/use-currency';

type Props = {
  transaction: TransactionWithCategory;
  onPress?: () => void;
};

export const TransactionCard = React.memo(({ transaction, onPress }: Props) => {
  const currency = getCurrency();
  const isIncome = transaction.type === 'income';
  const displayName = transaction.payee || transaction.category_name || 'Unknown';

  return (
    <Pressable className="flex-row items-center px-4 py-3" onPress={onPress}>
      <View
        className="mr-3 size-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${transaction.category_color || '#90A4AE'}20`,
        }}
      >
        <Text className="text-lg font-semibold" style={{ color: transaction.category_color || '#90A4AE' }}>
          {(transaction.category_name || '?')[0]}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-base font-medium" numberOfLines={1}>
          {displayName}
        </Text>
        {transaction.note
          ? (
              <Text className="text-sm text-neutral-500" numberOfLines={1}>
                {transaction.note}
              </Text>
            )
          : null}
      </View>

      <Text
        className={`text-base font-semibold ${isIncome ? 'text-success-600' : 'text-neutral-900 dark:text-neutral-100'}`}
      >
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount, currency)}
      </Text>
    </Pressable>
  );
});
