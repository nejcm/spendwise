import type { DateGroup, TransactionWithCategory } from '../types';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo } from 'react';

import { View } from 'react-native';
import { EmptyList, Text } from '@/components/ui';

import { formatDate } from '@/lib/format';
import { TransactionCard } from './transaction-card';

type Props = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
};

export function TransactionList({ transactions, isLoading }: Props) {
  const router = useRouter();

  const sections = useMemo(() => groupByDate(transactions), [transactions]);

  // Flatten groups into a mixed array of headers and items
  const flatData = useMemo(() => {
    const items: (string | TransactionWithCategory)[] = [];
    for (const group of sections) {
      items.push(group.date); // date header
      for (const t of group.transactions) {
        items.push(t);
      }
    }
    return items;
  }, [sections]);

  const renderItem = React.useCallback(
    ({ item }: { item: string | TransactionWithCategory }) => {
      if (typeof item === 'string') {
        return (
          <View className="bg-neutral-50 px-4 py-2 dark:bg-neutral-900">
            <Text className="text-sm font-semibold text-neutral-500">{formatDate(item)}</Text>
          </View>
        );
      }
      return <TransactionCard transaction={item} onPress={() => router.push(`/transactions/${item.id}` as any)} />;
    },
    [router],
  );

  if (!isLoading && transactions.length === 0) {
    return <EmptyList isLoading={false} />;
  }

  return (
    <FlashList
      data={flatData}
      renderItem={renderItem}
      getItemType={(item) => (typeof item === 'string' ? 'header' : 'row')}
      ListEmptyComponent={<EmptyList isLoading={isLoading} />}
    />
  );
}

function groupByDate(transactions: TransactionWithCategory[]): DateGroup[] {
  const groups: Map<string, TransactionWithCategory[]> = new Map();

  for (const t of transactions) {
    const dateKey = t.date.split('T')[0]; // normalize to date only
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(t);
    }
    else {
      groups.set(dateKey, [t]);
    }
  }

  return Array.from(groups.entries(), ([date, txns]) => ({
    date,
    transactions: txns,
  }));
}
