import type { AccountWithBalance } from '@/features/accounts/types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';

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
          <Text className="text-lg font-bold">
            {formatCurrency(account.balance, account.currency)}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {showConverted && formatCurrency(account.baseBalance, userCurrency)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
