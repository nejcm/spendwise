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
import { FocusAwareStatusBar, Input, inputDefaultDefaults, inputDefaults } from '@/components/ui';
import { X } from '@/components/ui/icon';
import { usePrefetchAdjacentPeriods } from '@/lib/data/prefetch';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { transactionsQueryOptions, useTransactions } from './api';
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
  const [debouncedSearch] = useDebouncedValue(search, debounceSettings);
  const { categoryId, type, accountId } = filters;
  const updateFilters = React.useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, [setFilters]);
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);
  const { data: transactions = [], isLoading, refetch } = useTransactions(startDate, endDate);

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

  return (
    <>
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
          <TransactionList transactions={filtered} isLoading={isLoading} onRefresh={() => void refetch()} />
        </View>
      </PeriodSwipeContainer>
    </>
  );
}
