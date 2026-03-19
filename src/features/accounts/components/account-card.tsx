import type { AccountWithBalance } from '@/features/accounts/types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { FormattedCurrency, Text } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';

import { useAppStore } from '@/lib/store';
import { ACCOUNT_TYPE_LABELS } from '../types';

type Props = {
  account: AccountWithBalance;
  onPress?: () => void;
};

export function AccountCard({ account, onPress }: Props) {
  const userCurrency = useAppStore.use.currency();
  const showConverted = account.currency !== userCurrency;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-xl bg-card p-4"
    >
      <View className="flex-row items-center justify-between gap-3">
        {account.icon && (
          <Text className="text-2xl">{account.icon}</Text>
        )}
        <View className="flex-1">
          <Text className="text-base/snug">{account.name}</Text>
          <Text className="text-sm text-muted-foreground">
            {ACCOUNT_TYPE_LABELS[account.type as keyof typeof ACCOUNT_TYPE_LABELS] || account.type}
          </Text>
        </View>
        <View className="items-end">
          <FormattedCurrency value={account.balance} currency={account.currency} className="text-lg font-bold" />
          {showConverted && (
            <FormattedCurrency value={account.baseBalance} currency={userCurrency} className="text-sm text-muted-foreground" />
          )}
        </View>
      </View>
      {account.budget != null && account.budget > 0 && account.monthlyExpense != null && (
        <BudgetProgressBar spent={account.monthlyExpense} budget={account.budget} className="mt-2" />
      )}
    </Pressable>
  );
}
