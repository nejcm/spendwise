import type { ActiveFilterChip } from './filters';
import type { TransactionRouteParams } from './route-params';
import type { FilterState } from './types';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { PeriodPill } from '@/components/period-pill';
import { EmptyState, FocusAwareStatusBar, GhostButton, Text, useModalSheet } from '@/components/ui';
import { useAccounts } from '@/features/accounts/hooks';
import { useCategories } from '@/features/categories/api';
import { formatCurrency } from '@/features/formatting/helpers';
import { usePrefetchAdjacentPeriods } from '@/lib/data/prefetch';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { setPeriodSelection, useAppStore } from '@/lib/store/store';
import { transactionsQueryOptions, useHasUserTransactions, useTransactions } from './api';
import { ActiveFilters, FilterResultCard, InOutNetCard, SearchRow, TypeTabs } from './components/activity-controls';
import { ActivityEmpty } from './components/activity-empty';
import { TransactionFilterSheet } from './components/transaction-filter-sheet';
import { TransactionList } from './components/transaction-list';
import { TransactionSelectionToolbar } from './components/transaction-selection-toolbar';
import { countActiveFilters, DEFAULT_FILTERS, filterTransactions, getActiveFilterChips, isDateSort, summarizeTransactions } from './filters';
import { useTransactionSelection } from './hooks/selection';
import { parseTransactionsRouteSeed } from './route-params';

const debounceSettings = {
  wait: 500,
} as const;

export function TransactionsScreen() {
  const params = useLocalSearchParams<TransactionRouteParams>();
  const initialRouteSeed = useRef(parseTransactionsRouteSeed(params)).current;
  const selection = useAppStore.use.periodSelection();
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const [search, setSearch] = useState(initialRouteSeed.search);
  const [filters, setFilters] = useState<FilterState>(initialRouteSeed.filters);
  const [debouncedSearch] = useDebouncedValue(search, debounceSettings);
  const filterSheet = useModalSheet();
  useEffect(() => {
    if (initialRouteSeed.periodSelection) setPeriodSelection(initialRouteSeed.periodSelection);
  }, [initialRouteSeed]);
  const updateFilters = React.useCallback((patch: Partial<FilterState>) => setFilters((prev) => ({ ...prev, ...patch })), []);

  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);
  const { data: transactions = [], isLoading, refetch } = useTransactions(startDate, endDate);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const db = useSQLiteContext();
  usePrefetchAdjacentPeriods(selection, (start, end) => transactionsQueryOptions(db, start, end));

  const filtered = useMemo(() => filterTransactions(transactions, filters, debouncedSearch), [transactions, filters, debouncedSearch]);
  const summary = useMemo(() => summarizeTransactions(filtered), [filtered]);
  const countFor = React.useCallback((draft: FilterState) => filterTransactions(transactions, draft, debouncedSearch).length, [transactions, debouncedSearch]);
  const filterCount = countActiveFilters(filters);
  const chips = useMemo(
    () => getActiveFilterChips(filters, { accounts, categories }, (cents) => formatCurrency(cents, currency, { numberFormat, currencyFormat, fractionDigits: cents % 100 === 0 ? 0 : 2 })),
    [accounts, categories, currency, currencyFormat, filters, numberFormat],
  );
  const { data: hasAny = true } = useHasUserTransactions(!isLoading && transactions.length === 0);

  const {
    selectionMode,
    selectedIds,
    selectedCount,
    toggleSelection,
    startSelection,
    clearSelection,
    deleteSelected,
  } = useTransactionSelection(filtered);

  const clearAll = React.useCallback(() => {
    setFilters((prev) => ({ ...DEFAULT_FILTERS, type: prev.type, sort: prev.sort }));
    setSearch('');
  }, []);

  const isNarrowed = filterCount > 0 || debouncedSearch.trim().length > 0;
  const header = (
    <View className="px-5 pt-2">
      <View pointerEvents="none" className="absolute inset-x-0 -top-2 h-[340px] bg-linear-to-b from-wash to-background" />
      <View className="h-12 flex-row items-center justify-between gap-3">
        <Text accessibilityRole="header" numberOfLines={1} className="shrink text-page-title font-bold tracking-page-title">{translate('nav.activity')}</Text>
        <PeriodPill selection={selection} />
      </View>
      {hasAny && (
        <>
          <SearchRow search={search} onChangeSearch={setSearch} filterCount={filterCount} onOpenFilters={filterSheet.present} />
          {filterCount > 0
            ? (
                <>
                  <ActiveFilters chips={chips} onRemove={(chip: ActiveFilterChip) => updateFilters(chip.remove)} onClearAll={clearAll} />
                  <FilterResultCard count={summary.count} total={summary.net} sort={filters.sort} onSortPress={filterSheet.present} />
                </>
              )
            : <InOutNetCard income={summary.income} expense={summary.expense} net={summary.net} />}
          <TypeTabs value={filters.type} onChange={(type) => updateFilters({ type })} />
        </>
      )}
    </View>
  );

  const empty = hasAny
    ? (
        <View className="px-5 pt-14">
          <EmptyState
            title={translate(isNarrowed ? 'transactions.empty.no_results' : 'transactions.empty.no_period')}
            body={translate(isNarrowed ? 'transactions.empty.no_results_body' : 'transactions.empty.no_period_body')}
            actions={isNarrowed && <GhostButton label={translate('transactions.filter.clear_all')} onPress={clearAll} textClassName="underline" />}
          />
        </View>
      )
    : <ActivityEmpty />;

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <TransactionList
        transactions={filtered}
        isLoading={isLoading}
        onRefresh={() => void refetch()}
        grouped={isDateSort(filters.sort)}
        showAccount
        header={header}
        empty={empty}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onSelect={toggleSelection}
        onStartSelection={startSelection}
        containerClassName="pb-16"
      />
      {selectionMode && (
        <TransactionSelectionToolbar
          selectedCount={selectedCount}
          onClear={clearSelection}
          onDelete={deleteSelected}
        />
      )}
      <TransactionFilterSheet
        ref={filterSheet.ref}
        filters={filters}
        countFor={countFor}
        onApply={(next) => {
          setFilters(next);
          filterSheet.close();
        }}
      />
    </View>
  );
}
