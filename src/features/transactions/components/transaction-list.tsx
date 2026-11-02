import type { DayGroup } from '../filters';
import type { TransactionWithCategory } from '../types';
import { FlashList } from '@shopify/flash-list';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';

import NoData from '@/components/no-data';
import { ActivityIndicator, FormattedCurrency, Text, View } from '@/components/ui';
import { formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { groupByDay } from '../filters';
import { TransactionCard } from './transaction-card';

export type TransactionListProps = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  onRefresh?: () => Promise<void> | void;
  /** Day headers with day totals; turn off for amount-sorted lists. */
  grouped?: boolean;
  showAccount?: boolean;
  header?: React.ReactElement;
  empty?: React.ReactElement;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onStartSelection?: (id: string) => void;
  containerClassName?: string;
};

type Item = Omit<DayGroup, 'transactions'> | TransactionWithCategory;
const isHeader = (item: Item): item is Omit<DayGroup, 'transactions'> => 'day' in item;

export function TransactionList({
  transactions,
  isLoading,
  onRefresh,
  grouped = true,
  showAccount = false,
  header,
  empty,
  selectionMode = false,
  selectedIds,
  onSelect,
  onStartSelection,
  containerClassName,
}: TransactionListProps) {
  const [refreshing, setRefreshing] = useState(false);
  const currency = useAppStore.use.currency();
  const isCompact = useAppStore.use.density() === 'compact';

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const items = useMemo<Item[]>(
    () => grouped ? groupByDay(transactions).flatMap(({ transactions: rows, ...group }) => [group, ...rows]) : transactions,
    [grouped, transactions],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: Item }) => {
      if (isHeader(item)) {
        return (
          <View className={`flex-row justify-between px-5 ${isCompact ? 'pt-2' : 'pt-4.5'} pb-0.5`}>
            <Text className="text-meta text-muted-foreground">{formatDate(item.day, 'EEEE, MMM d')}</Text>
            {item.total !== null && (
              <FormattedCurrency value={item.total} currency={currency} prefix={item.total > 0 ? '+' : ''} className="text-meta text-muted-foreground" />
            )}
          </View>
        );
      }
      return (
        <TransactionCard
          transaction={item}
          className="px-5"
          showDate={!grouped}
          showAccount={showAccount}
          selectionMode={selectionMode}
          selected={selectedIds?.has(item.id)}
          onSelect={onSelect}
          onStartSelection={onStartSelection}
        />
      );
    },
    [currency, grouped, isCompact, onSelect, onStartSelection, selectedIds, selectionMode, showAccount],
  );

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => (isHeader(item) ? `header-${item.day}` : `tx-${item.id}`)}
      getItemType={(item) => (isHeader(item) ? 'header' : 'row')}
      contentContainerClassName={containerClassName || 'pb-6'}
      ListHeaderComponent={header}
      ListEmptyComponent={isLoading ? <ActivityIndicator className="py-16" /> : (empty ?? <NoData className="py-16" title={translate('transactions.no_transactions')} />)}
      refreshControl={
        onRefresh
          ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          : undefined
      }
    />
  );
}
