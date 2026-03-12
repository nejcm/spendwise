import { useForm } from '@tanstack/react-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import * as z from 'zod';

import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { getFieldError } from '@/components/ui/form-utils';
import { formatCurrency, todayISO } from '@/features/formatting/helpers';
import { useAccounts } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useAddGoalContribution, useDeleteGoal, useGoal } from './api';

const schema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  account_id: z.string().min(1, 'Account is required'),
});

const defaultValues = {
  amount: '',
  account_id: '',
};

export function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const { data: goal } = useGoal(id ?? '');
  const { data: accounts = [] } = useAccounts();
  const addContribution = useAddGoalContribution();
  const deleteGoal = useDeleteGoal();

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      account_id: accounts[0]?.id ?? null,
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      addContribution.mutate(
        { goalId: goal!.id, amount: value.amount, accountId: value.account_id, date: todayISO() },
        { onSuccess: () => form.setFieldValue('amount', '') },
      );
    },
  });

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
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
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
            <Text className="text-sm font-medium">
              {formatCurrency(goal.target_amount, currency)}
              {' '}
              target
            </Text>
          </View>
        </View>

        {!goal.is_completed && (
          <View className="mb-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="mb-3 text-base font-medium">{translate('goals.add_contribution')}</Text>

            <form.Field
              name="amount"
              children={(field) => (
                <Input
                  label={translate('transactions.amount')}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  error={getFieldError(field)}
                />
              )}
            />

            <form.Field
              name="account_id"
              children={(field) => (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {accounts.map((a) => (
                    <Button
                      key={a.id}
                      label={a.name}
                      variant={field.state.value === a.id ? 'default' : 'outline'}
                      onPress={() => field.handleChange(a.id)}
                      size="sm"
                    />
                  ))}
                </View>
              )}
            />

            <form.Subscribe
              selector={(state) => [state.isSubmitting, state.values.amount, state.values.account_id]}
              children={([isSubmitting, amount, accountId]) => (
                <Button
                  label={translate('goals.contribute')}
                  onPress={form.handleSubmit}
                  disabled={!(amount as string) || !(accountId as string) || (isSubmitting as boolean) || addContribution.isPending}
                  loading={(isSubmitting as boolean) || addContribution.isPending}
                  className="mt-3"
                />
              )}
            />
          </View>
        )}

        {goal.is_completed && (
          <View className="mb-4 items-center rounded-xl bg-success-50 p-4 dark:bg-success-900/20">
            <Text className="font-medium text-success-600">
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
