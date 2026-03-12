import type { MonthPickerRef } from './components/month-picker';
import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowRightIcon, X } from 'lucide-react-native';
import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FocusAwareStatusBar, Input, Text } from '@/components/ui';
import { formatMonthYear } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useTransactions } from './api';
import { MonthPicker } from './components/month-picker';
import { TransactionFilterBar } from './components/transaction-filter-bar';
import { TransactionList } from './components/transaction-list';

export function TransactionListScreen() {
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const monthPickerRef = useRef<MonthPickerRef>(null);

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

      <View className="flex-row items-center justify-between p-4">
        <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
          <ArrowLeftIcon className="size-5 text-neutral-500" />
        </Pressable>
        <Pressable onPress={() => monthPickerRef.current?.present()} hitSlop={12} className="min-w-[120px] items-center">
          <Text className="text-lg font-medium">{monthLabel}</Text>
        </Pressable>
        <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
          <ArrowRightIcon className="size-5 text-neutral-500" />
        </Pressable>
      </View>

      <MonthPicker
        ref={monthPickerRef}
        selectedMonth={currentMonth}
        onSelect={setCurrentMonth}
      />

      <View className="flex-row items-center gap-2 px-4 pb-2">
        <View className="min-w-0 flex-1 flex-row items-center rounded-md border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800">
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
              <X className="size-5 text-neutral-500" />
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
    </View>
  );
}
