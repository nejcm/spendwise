import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { OutlineButton } from '@/components/ui/outline-button';
import { formatCurrency } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

import { defaultStyles } from '@/lib/theme/styles';
import { useBudgetWithProgress, useDeleteBudget } from './api';
import { BudgetProgressBar } from './components/budget-progress-bar';

export function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const { data: budget } = useBudgetWithProgress(id ?? '');
  const deleteBudget = useDeleteBudget();
  if (!budget) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>{translate('common.loading')}</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(translate('common.delete'), translate('budgets.delete_confirm'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.delete'),
        style: 'destructive',
        onPress: () => deleteBudget.mutate(budget.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const remaining = budget.amount - budget.total_spent;

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        <View className="mb-4 items-center rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
          <Text className="text-lg font-bold">{budget.name}</Text>
          <View className="mt-3 w-full">
            <BudgetProgressBar spent={budget.total_spent} total={budget.amount} height={12} />
          </View>
          <View className="mt-2 w-full flex-row justify-between">
            <Text className="text-sm text-gray-500">
              {formatCurrency(budget.total_spent, currency)}
              {' '}
              {translate('budgets.spent')}
            </Text>
            <Text className={`text-sm font-medium ${remaining < 0 ? 'text-danger-500' : 'text-success-600'}`}>
              {formatCurrency(Math.abs(remaining), currency)}
              {' '}
              {remaining < 0 ? translate('budgets.over') : translate('budgets.left')}
            </Text>
          </View>
        </View>

        <Text className="mb-3 text-lg font-medium">{translate('budgets.categories')}</Text>

        {budget.lines.map((line) => (
          <CategoryBudgetRow key={line.id} line={line} currency={currency} />
        ))}

        <View className="mt-6 mb-8">
          <OutlineButton
            label={translate('common.delete')}
            color="danger"
            onPress={handleDelete}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function CategoryBudgetRow({ line, currency }: { line: any; currency: string }) {
  const ratio = line.amount > 0 ? line.spent / line.amount : 0;

  return (
    <View className="mb-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
      <View className="mb-1 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="size-3 rounded-full" style={{ backgroundColor: line.category_color }} />
          <Text className="text-sm font-medium">{line.category_name}</Text>
        </View>
        <Text className="text-sm text-gray-500">
          {formatCurrency(line.spent, currency)}
          {' '}
          /
          {formatCurrency(line.amount, currency)}
        </Text>
      </View>
      <BudgetProgressBar spent={line.spent} total={line.amount} height={6} />
      {ratio > 1 && (
        <Text className="mt-1 text-xs text-danger-500">
          {formatCurrency(line.spent - line.amount, currency)}
          {' '}
          {translate('budgets.over')}
        </Text>
      )}
    </View>
  );
}
