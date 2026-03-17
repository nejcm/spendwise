import type { DateGroup, TransactionWithCategory } from '../types';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import NoData from '@/components/no-data';
import { Text } from '@/components/ui';
import { formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { TransactionCard } from './transaction-card';

export type TransactionListProps = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  onRefresh?: () => Promise<void> | void;
};

export function TransactionList({ transactions, isLoading, onRefresh }: TransactionListProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

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
          <View className="mt-4 px-4 py-2">
            <Text className="text-sm font-medium text-gray-500">{formatDate(item)}</Text>
          </View>
        );
      }
      return <TransactionCard transaction={item} onPress={() => router.push(`/transactions/${item.id}` as any)} />;
    },
    [router],
  );

  if (!isLoading && transactions.length === 0) {
    return <NoData title={translate('transactions.no_transactions')} className="py-16" />;
  }

  return (
    <FlashList
      className="pb-6"
      data={flatData}
      renderItem={renderItem}
      getItemType={(item) => (typeof item === 'string' ? 'header' : 'row')}
      ListEmptyComponent={isLoading ? <ActivityIndicator /> : <NoData className="py-16" title={translate('transactions.no_transactions')} />}
      refreshControl={
        onRefresh
          ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          : undefined
      }
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
