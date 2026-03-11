import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Pressable, TextInput, View } from 'react-native';

import { FocusAwareStatusBar, Text } from '@/components/ui';
import { formatMonthYear } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';

import { useTransactions } from './api';
import { QuickAddSheet } from './components/quick-add-sheet';
import { TransactionFilterBar } from './components/transaction-filter-bar';
import { TransactionList } from './components/transaction-list';

export function TransactionListScreen() {
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);

  const { data: transactions = [], isLoading, refetch } = useTransactions(currentMonth);

  const navigateMonth = useCallback(
    (direction: -1 | 1) => {
      const [year, month] = currentMonth.split('-').map(Number);
      const date = new Date(year, month - 1 + direction, 1);
      setCurrentMonth(format(date, 'yyyy-MM'));
    },
    [currentMonth],
  );

  const monthLabel = useMemo(() => formatMonthYear(`${currentMonth}-01`), [currentMonth]);

  const filtered = useMemo(() => {
    let result = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.note?.toLowerCase().includes(q)
          || t.category_name?.toLowerCase().includes(q),
      );
    }
    if (categoryFilter) {
      result = result.filter((t) => t.category_id === categoryFilter);
    }
    return result;
  }, [transactions, search, categoryFilter]);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
          <Text className="text-2xl text-primary-400">&lt;</Text>
        </Pressable>
        <Text className="text-lg font-semibold">{monthLabel}</Text>
        <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
          <Text className="text-2xl text-primary-400">&gt;</Text>
        </Pressable>
      </View>

      <View className="px-4 pb-2">
        <TextInput
          className="rounded-lg bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800 dark:text-white"
          placeholder={translate('transactions.search')}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      <TransactionFilterBar
        selectedCategoryId={categoryFilter}
        onSelectCategory={setCategoryFilter}
      />

      <View className="flex-1">
        <TransactionList transactions={filtered} isLoading={isLoading} onRefresh={refetch} />
      </View>

      <Pressable
        className="absolute right-6 bottom-6 size-14 items-center justify-center rounded-full bg-primary-400 shadow-lg"
        onPress={() => sheetRef.current?.present()}
      >
        <Text className="text-2xl font-bold text-white">+</Text>
      </Pressable>

      <QuickAddSheet sheetRef={sheetRef} />
    </View>
  );
}
