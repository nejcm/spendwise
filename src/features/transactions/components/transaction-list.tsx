import type { DateGroup, TransactionWithCategory } from '../types';
import { FlashList } from '@shopify/flash-list';
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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const sections = useMemo(() => groupByDate(transactions), [transactions]);

  // Flatten groups into a mixed array of headers (Unix seconds) and items
  const flatData = useMemo(() => {
    const items: (number | TransactionWithCategory)[] = [];
    for (const group of sections) {
      items.push(group.date); // date header (Unix seconds)
      for (const t of group.transactions) {
        items.push(t);
      }
    }
    return items;
  }, [sections]);

  const renderItem = React.useCallback(
    ({ item }: { item: number | TransactionWithCategory }) => {
      if (typeof item === 'number') {
        return (
          <View className="mt-4 px-4 py-2">
            <Text className="text-sm font-medium text-gray-500">{formatDate(item)}</Text>
          </View>
        );
      }
      return <TransactionCard transaction={item} />;
    },
    [],
  );

  if (!isLoading && transactions.length === 0) {
    return <NoData title={translate('transactions.no_transactions')} className="py-16" />;
  }

  return (
    <FlashList
      className="pb-6"
      data={flatData}
      renderItem={renderItem}
      keyExtractor={(item) => (typeof item === 'number' ? `header-${item}` : `tx-${item.id}`)}
      getItemType={(item) => (typeof item === 'number' ? 'header' : 'row')}
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
  const groups: Map<number, TransactionWithCategory[]> = new Map();

  for (const t of transactions) {
    // Normalize to day-start Unix seconds (floor to day boundary using 86400s/day)
    const dayKey = Math.floor(t.date / 86400) * 86400;
    const existing = groups.get(dayKey);
    groups.set(dayKey, existing ? [...existing, t] : [t]);
  }

  return Array.from(groups.entries(), ([date, txns]) => ({
    date,
    transactions: txns,
  }));
}
