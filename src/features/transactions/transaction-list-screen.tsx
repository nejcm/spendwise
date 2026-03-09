import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Pressable, View } from 'react-native';

import { FocusAwareStatusBar, Text } from '@/components/ui';
import { formatMonthYear } from '@/lib/format';

import { useTransactions } from './api';
import { QuickAddSheet } from './components/quick-add-sheet';
import { TransactionList } from './components/transaction-list';

export function TransactionListScreen() {
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const sheetRef = useRef<BottomSheetModal>(null);

  const { data: transactions = [], isLoading } = useTransactions(currentMonth);

  const navigateMonth = useCallback(
    (direction: -1 | 1) => {
      const [year, month] = currentMonth.split('-').map(Number);
      const date = new Date(year, month - 1 + direction, 1);
      setCurrentMonth(format(date, 'yyyy-MM'));
    },
    [currentMonth],
  );

  const monthLabel = useMemo(() => formatMonthYear(`${currentMonth}-01`), [currentMonth]);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      {/* Month navigation */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
          <Text className="text-2xl text-primary-400">&lt;</Text>
        </Pressable>
        <Text className="text-lg font-semibold">{monthLabel}</Text>
        <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
          <Text className="text-2xl text-primary-400">&gt;</Text>
        </Pressable>
      </View>

      {/* Transaction list */}
      <View className="flex-1">
        <TransactionList transactions={transactions} isLoading={isLoading} />
      </View>

      {/* FAB */}
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
