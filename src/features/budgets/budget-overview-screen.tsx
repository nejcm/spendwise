import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { getCurrency } from '@/lib/hooks/use-currency';
import { translate } from '@/lib/i18n';

import { useBudgetsOverview } from './api';
import { BudgetCard } from './components/budget-card';

export function BudgetOverviewScreen() {
  const router = useRouter();
  const currency = getCurrency();
  const { data: budgets = [] } = useBudgetsOverview();

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.total_spent, 0);
  const leftToSpend = totalBudgeted - totalSpent;

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        {budgets.length > 0 && (
          <View className="mb-4 items-center rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
            <Text className="text-sm text-neutral-500">{translate('budgets.left_to_spend')}</Text>
            <Text className={`mt-1 text-2xl font-bold ${leftToSpend < 0 ? 'text-danger-500' : ''}`}>
              {formatCurrency(leftToSpend, currency)}
            </Text>
          </View>
        )}

        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onPress={() => router.push(`/budgets/${budget.id}` as any)}
          />
        ))}

        {budgets.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-neutral-500">{translate('budgets.no_budgets')}</Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        className="absolute right-6 bottom-6 size-14 items-center justify-center rounded-full bg-primary-400 shadow-lg"
        onPress={() => router.push('/budgets/create' as any)}
      >
        <Text className="text-2xl font-bold text-white">+</Text>
      </Pressable>
    </View>
  );
}
