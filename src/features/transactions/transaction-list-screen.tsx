import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowRightIcon, X } from 'lucide-react-native';
import * as React from 'react';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { FocusAwareStatusBar, Input, inputDefaults, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { MonthPicker, YearPicker } from '../../components/month-year-picker';
import { IconButton } from '../../components/ui/icon-button';
import { useTransactions } from './api';
import { TransactionFilterBar } from './components/transaction-filter-bar';
import { TransactionList } from './components/transaction-list';

export function TransactionListScreen() {
  // [year, month]
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = format(new Date(), 'yyyy-MM');
    const split = date.split('-');
    return [Number(split[0]), Number(split[1])];
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const monthPickerRef = useRef<BottomSheetModal>(null);
  const yearPickerRef = useRef<BottomSheetModal>(null);

  const { data: transactions = [], isLoading, refetch } = useTransactions(selectedDate.join('-'));

  const monthName = useMemo(
    () => format(new Date(selectedDate[0], selectedDate[1] - 1, 1), 'MMMM'),
    [selectedDate],
  );

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

  const navigateMonth = (direction: -1 | 1) => {
    const date = new Date(selectedDate[0], selectedDate[1] - 1 + direction, 1);
    setSelectedDate([date.getFullYear(), date.getMonth() + 1]);
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <View className="flex-row items-center justify-between p-4">
        <IconButton size="sm" color="none" onPress={() => navigateMonth(-1)} hitSlop={12}>
          <ArrowLeftIcon className="size-5 text-muted-foreground" />
        </IconButton>
        <View className="flex-row items-center gap-1">
          <Pressable onPress={() => monthPickerRef.current?.present()} hitSlop={12}>
            <Text className="text-lg font-medium">{monthName}</Text>
          </Pressable>
          <Pressable onPress={() => yearPickerRef.current?.present()} hitSlop={12}>
            <Text className="text-lg font-medium">{selectedDate[0]}</Text>
          </Pressable>
        </View>
        <IconButton size="sm" color="none" onPress={() => navigateMonth(1)} hitSlop={12}>
          <ArrowRightIcon className="size-5 text-muted-foreground" />
        </IconButton>
      </View>

      <MonthPicker
        ref={monthPickerRef}
        selectedMonth={selectedDate[1]}
        onSelect={(month) => setSelectedDate((prev) => [prev[0], month])}
      />
      <YearPicker
        ref={yearPickerRef}
        selectedYear={selectedDate[0]}
        onSelect={(year) => setSelectedDate((prev) => [year, prev[1]])}
      />
      <View className="flex-row items-center gap-2 px-4 pb-2">
        <View className={cn(inputDefaults, 'min-w-0 flex-1 flex-row items-center p-0')}>
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
    </View>
  );
}
