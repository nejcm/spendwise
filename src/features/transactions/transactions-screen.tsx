import type { TransactionRouteParams } from './route-params';
import type { FilterState } from './types';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { PeriodSelector } from '@/components/period-selector';
import { PeriodSwipeContainer } from '@/components/period-swipe-container';
import { Alert, FocusAwareStatusBar, IconButton, Input, inputDefaultDefaults, inputDefaults, OverflowMenu, Text, TrashIcon } from '@/components/ui';
import { EllipsisVertical, X } from '@/components/ui/icon';
import { usePrefetchAdjacentPeriods } from '@/lib/data/prefetch';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { transactionsQueryOptions, useDeleteTransactions, useTransactions } from './api';
import { TransactionFilterBar } from './components/transaction-filter-bar';
import { TransactionList } from './components/transaction-list';
import { parseTransactionsRouteSeed } from './route-params';

const inputClassNames = cn(inputDefaults, inputDefaultDefaults, 'min-w-0 flex-1 flex-row items-center p-0');

const debounceSettings = {
  wait: 500,
} as const;

export function TransactionsScreen() {
  const params = useLocalSearchParams<TransactionRouteParams>();
  const initialRouteSeed = useRef(parseTransactionsRouteSeed(params)).current;
  const selection = useAppStore.use.periodSelection();
  const [search, setSearch] = useState(initialRouteSeed.search);
  const [filters, setFilters] = useState<FilterState>(initialRouteSeed.filters);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [debouncedSearch] = useDebouncedValue(search, debounceSettings);
  const { categoryId, type, accountId } = filters;
  const updateFilters = React.useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, [setFilters]);
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);
  const { data: transactions = [], isLoading, refetch } = useTransactions(startDate, endDate);
  const deleteTransactions = useDeleteTransactions(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  });

  const db = useSQLiteContext();
  usePrefetchAdjacentPeriods(selection, (start, end) => transactionsQueryOptions(db, start, end));

  const filtered = useMemo(() => {
    const q = debouncedSearch?.trim().toLowerCase();
    const hasQuery = q.length > 0;
    if (hasQuery || categoryId || type || accountId) {
      return transactions.filter(
        (t) => {
          if (categoryId && t.category_id !== categoryId) return false;
          if (type && t.type !== type) return false;
          if (accountId && t.account_id !== accountId) return false;
          if (hasQuery) {
            return t.note?.toLowerCase().includes(q)
              || t.category_name?.toLowerCase().includes(q)
              || t.merchant_name?.toLowerCase().includes(q)
              || t.amount?.toString().includes(q);
          }
          return true;
        },
      );
    }
    return transactions;
  }, [transactions, debouncedSearch, categoryId, type, accountId]);

  const toggleSelection = React.useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startSelection = React.useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const currentTransactionIds = useMemo(() => new Set(transactions.map((transaction) => transaction.id)), [transactions]);
  const currentSelectedIds = useMemo(
    () => [...selectedIds].filter((id) => currentTransactionIds.has(id)),
    [currentTransactionIds, selectedIds],
  );
  const selectedCount = currentSelectedIds.length;
  const handleDeleteSelected = React.useCallback(() => {
    if (selectedCount === 0) return;
    Alert.alert(
      translate('common.delete'),
      translate('transactions.delete_selected_confirmation', { count: selectedCount }),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.delete'),
          style: 'destructive',
          onPress: () => deleteTransactions.mutate(currentSelectedIds),
        },
      ],
    );
  }, [currentSelectedIds, deleteTransactions, selectedCount]);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <PeriodSelector selection={selection} />

      <View className="flex-row items-center gap-2 px-4">
        <View className={inputClassNames}>
          <Input
            value={search}
            placeholder={translate('transactions.search')}
            onChangeText={setSearch}
            size="sm"
            containerClassName="min-w-0 flex-1"
            className="rounded-r-none border-0 bg-transparent pr-8 focus:border-0"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={8}
              className="absolute right-2 p-1"
              pointerEvents="box-only"
            >
              <X className="size-5 text-gray-500" />
            </Pressable>
          )}
        </View>
      </View>
      <TransactionFilterBar
        filters={filters}
        hasActiveFilters={categoryId !== null || type !== null || accountId !== null}
        updateFilters={updateFilters}
      />
      <PeriodSwipeContainer selection={selection}>
        <View className="flex-1">
          <TransactionList
            transactions={filtered}
            isLoading={isLoading}
            onRefresh={() => void refetch()}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelect={toggleSelection}
            onStartSelection={startSelection}
          />
        </View>
      </PeriodSwipeContainer>
      {selectionMode && (
        <View className="absolute inset-x-4 bottom-3 flex-row items-center rounded-xl border border-border/50 bg-background/90 px-3 py-1 shadow-lg dark:bg-background/95">
          <Text className="flex-1 font-medium">
            {translate('transactions.selected_count', { count: selectedCount })}
          </Text>
          <IconButton
            color="none"
            onPress={() => {
              setSelectedIds(new Set());
              setSelectionMode(false);
            }}
            size="md"
          >
            <X className="size-5 text-muted-foreground" />
          </IconButton>
          <OverflowMenu
            accessibilityLabel={translate('settings.more')}
            className="-mr-2"
            containerClassName="py-0"
            placement="above"
            icon={<EllipsisVertical className="text-muted-foreground" size={18} />}
            items={selectedCount > 0
              ? [{
                  label: translate('common.delete'),
                  onPress: handleDeleteSelected,
                  className: 'text-danger-600',
                  icon: <TrashIcon size={16} colorClassName="accent-danger-600" className="mr-2" />,
                }]
              : []}
          />
        </View>
      )}
    </View>
  );
}
