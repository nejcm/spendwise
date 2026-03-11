import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { useAccounts } from '@/features/transactions/api';
import { formatCurrency, todayISO } from '@/lib/format';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

import { useAddGoalContribution, useDeleteGoal, useGoal } from './api';

export function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const { data: goal } = useGoal(id ?? '');
  const { data: accounts = [] } = useAccounts();
  const addContribution = useAddGoalContribution();
  const deleteGoal = useDeleteGoal();

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? '');

  if (!goal) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>{translate('common.loading')}</Text>
      </View>
    );
  }

  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;

  const handleContribute = () => {
    if (!amount || !accountId) {
      return;
    }
    addContribution.mutate(
      { goalId: goal.id, amount, accountId, date: todayISO() },
      { onSuccess: () => setAmount('') },
    );
  };

  const handleDelete = () => {
    Alert.alert(translate('common.delete'), `Delete "${goal.name}"?`, [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.delete'),
        style: 'destructive',
        onPress: () => deleteGoal.mutate(goal.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="mb-4 rounded-xl p-4" style={{ backgroundColor: `${goal.color}15` }}>
          <Text className="mb-1 text-lg font-bold">{goal.name}</Text>
          <View className="my-2 h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <View
              className="h-3 rounded-full"
              style={{ width: `${progress}%`, backgroundColor: goal.color }}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">
              {formatCurrency(goal.current_amount, currency)}
              {' '}
              saved
            </Text>
            <Text className="text-sm font-semibold">
              {formatCurrency(goal.target_amount, currency)}
              {' '}
              target
            </Text>
          </View>
        </View>

        {!goal.is_completed && (
          <View className="mb-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="mb-3 text-base font-semibold">{translate('goals.add_contribution')}</Text>
            <Input
              label={translate('transactions.amount')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <View className="mt-3 flex-row flex-wrap gap-2">
              {accounts.map((a) => (
                <Button
                  key={a.id}
                  label={a.name}
                  variant={accountId === a.id ? 'default' : 'outline'}
                  onPress={() => setAccountId(a.id)}
                  size="sm"
                />
              ))}
            </View>
            <Button
              label={translate('goals.contribute')}
              onPress={handleContribute}
              disabled={!amount || !accountId || addContribution.isPending}
              className="mt-3"
            />
          </View>
        )}

        {goal.is_completed && (
          <View className="mb-4 items-center rounded-xl bg-success-50 p-4 dark:bg-success-900/20">
            <Text className="font-semibold text-success-600">
              🎉
              {translate('goals.goal_reached')}
            </Text>
          </View>
        )}

        <Button
          label={translate('common.delete')}
          variant="destructive"
          onPress={handleDelete}
          className="mb-8"
        />
      </ScrollView>
    </View>
  );
}
