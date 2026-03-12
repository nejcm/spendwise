import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';
import { useGoals } from '@/features/goals/api';
import { GoalCard } from '@/features/goals/components/goal-card';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';

import { useBudgetsOverview } from './api';
import { BudgetCard } from './components/budget-card';

export function BudgetOverviewScreen() {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const { data: budgets = [] } = useBudgetsOverview();
  const { data: goals = [] } = useGoals();
  const activeGoals = goals.filter((g) => !g.is_completed);

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.total_spent, 0);
  const leftToSpend = totalBudgeted - totalSpent;

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
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
          <View className="items-center py-8">
            <Text className="text-neutral-500">{translate('budgets.no_budgets')}</Text>
          </View>
        )}

        {/* Goals section */}
        <View className="mt-4 mb-2 flex-row items-center justify-between">
          <Text className="text-base font-medium">{translate('goals.title')}</Text>
          <Pressable onPress={() => router.push('/goals' as any)}>
            <Text className="text-sm text-primary-500">{translate('home.see_all')}</Text>
          </Pressable>
        </View>

        {activeGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onPress={() => router.push(`/goals/${goal.id}` as any)}
          />
        ))}

        {activeGoals.length === 0 && (
          <View className="mb-8 items-center py-6">
            <Text className="text-neutral-500">{translate('goals.no_goals')}</Text>
            <Pressable className="mt-2" onPress={() => router.push('/goals/create' as any)}>
              <Text className="text-sm text-primary-500">{translate('goals.create')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
