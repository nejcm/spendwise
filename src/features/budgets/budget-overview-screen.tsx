import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

import { FocusAwareStatusBar, FormattedCurrency, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';

import { useBudgetsOverview } from './api';
import { BudgetCard } from './components/budget-card';

export function BudgetOverviewScreen() {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const { data: budgets = [] } = useBudgetsOverview();

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.total_spent, 0);
  const leftToSpend = totalBudgeted - totalSpent;

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        {budgets.length > 0 && (
          <View className="mb-4 items-center rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
            <Text className="text-sm text-gray-500">{translate('budgets.left_to_spend')}</Text>
            <FormattedCurrency value={leftToSpend} currency={currency} className={`mt-1 text-2xl font-bold ${leftToSpend < 0 ? 'text-danger-500' : ''}`} />
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
          <View className="items-center py-8">
            <Text className="text-gray-500">{translate('budgets.no_budgets')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
