import { useDebouncedValue } from '@tanstack/react-pacer';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, Input, inputDefaultDefaults, inputDefaults } from '@/components/ui';
import { X } from '@/components/ui/icon';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useTransactions } from './api';
import { TransactionFilterBar } from './components/transaction-filter-bar';
import { TransactionList } from './components/transaction-list';

const inputClassNames = cn(inputDefaults, inputDefaultDefaults, 'min-w-0 flex-1 flex-row items-center p-0');

export function TransactionsScreen() {
  const selection = useAppStore.use.periodSelection();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, {
    wait: 500,
  });
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);
  const { data: transactions = [], isLoading, refetch } = useTransactions(startDate, endDate);

  const filtered = useMemo(() => {
    let result = transactions;
    const q = debouncedSearch?.trim().toLowerCase();
    const hasQuery = q.length > 0;
    if (hasQuery || categoryFilter) {
      result = result.filter(
        (t) => {
          if (categoryFilter && t.category_id !== categoryFilter) return false;
          if (hasQuery) return t.note?.toLowerCase().includes(q) || t.category_name?.toLowerCase().includes(q);
          return true;
        },
      );
    }

    return result;
  }, [transactions, debouncedSearch, categoryFilter]);

  return (
    <>
      <FocusAwareStatusBar />

      <PeriodSelector selection={selection} />

      <View className="flex-row items-center gap-2 px-4 pb-2">
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
        selectedCategoryId={categoryFilter}
        onSelectCategory={setCategoryFilter}
      />
      <View className="flex-1">
        <TransactionList transactions={filtered} isLoading={isLoading} onRefresh={() => void refetch()} />
      </View>
    </>
  );
}
