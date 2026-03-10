import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo } from 'react';

import { Pressable, View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { useCategorySpend } from '@/features/insights/api';
import { SpendingByCategory } from '@/features/insights/components/spending-by-category';
import { useMonthSummary, useRecentTransactions, useTotalBalance } from '@/features/transactions/api';
import { TransactionCard } from '@/features/transactions/components/transaction-card';

import { formatCurrency } from '@/lib/format';
import { getCurrency } from '@/lib/hooks/use-currency';
import { translate } from '@/lib/i18n';

export function HomeScreen() {
  const router = useRouter();
  const currency = getCurrency();

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  const { data: totalBalance = 0 } = useTotalBalance();
  const { data: monthSummary } = useMonthSummary(currentMonth);
  const { data: recentTransactions = [] } = useRecentTransactions(5);
  const { data: categorySpend = [] } = useCategorySpend(currentMonth);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1">
        <View className="px-4 pt-16 pb-6">
          {/* Total Balance */}
          <Text className="text-center text-sm text-neutral-500">{translate('home.total_balance')}</Text>
          <Text className="mt-1 text-center text-4xl font-bold">{formatCurrency(totalBalance, currency)}</Text>

          {/* Income / Expense cards */}
          {monthSummary && (
            <View className="mt-6 flex-row gap-3">
              <View className="flex-1 rounded-xl bg-success-50 p-4 dark:bg-success-900/20">
                <Text className="text-sm text-success-600">{translate('home.income')}</Text>
                <Text className="mt-1 text-xl font-bold text-success-600">
                  {formatCurrency(monthSummary.income, currency)}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-danger-50 p-4 dark:bg-danger-900/20">
                <Text className="text-sm text-danger-500">{translate('home.expenses')}</Text>
                <Text className="mt-1 text-xl font-bold text-danger-500">
                  {formatCurrency(monthSummary.expense, currency)}
                </Text>
              </View>
            </View>
          )}

          {/* Insights preview */}
          {categorySpend.length > 0 && (
            <View className="mt-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold">{translate('insights.title')}</Text>
                <Pressable onPress={() => router.push('/insights' as any)}>
                  <Text className="text-sm font-medium text-primary-400">{translate('home.see_all')}</Text>
                </Pressable>
              </View>
              <View className="mt-2 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                <SpendingByCategory data={categorySpend.slice(0, 5)} />
              </View>
            </View>
          )}

          {/* Recent Transactions */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold">{translate('home.recent_transactions')}</Text>
              <Pressable onPress={() => router.push('/(app)/transactions')}>
                <Text className="text-sm font-medium text-primary-400">{translate('home.see_all')}</Text>
              </Pressable>
            </View>

            {recentTransactions.length === 0
              ? (
                  <View className="mt-4 items-center rounded-xl bg-neutral-50 py-8 dark:bg-neutral-800">
                    <Text className="text-neutral-500">{translate('home.no_transactions')}</Text>
                  </View>
                )
              : (
                  <View className="mt-2 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                    {recentTransactions.map((t) => (
                      <TransactionCard
                        key={t.id}
                        transaction={t}
                        onPress={() => router.push(`/transactions/${t.id}` as any)}
                      />
                    ))}
                  </View>
                )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
