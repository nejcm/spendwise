import type { AccountWithBalance } from '@/features/transactions/types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency } from '@/lib/format';

import { useAppStore } from '@/lib/store';
import { ACCOUNT_TYPE_LABELS } from '../types';

type Props = {
  account: AccountWithBalance;
  onPress?: () => void;
};

export function AccountCard({ account, onPress }: Props) {
  const currency = useAppStore.use.currency();
  const bgColor = account.color || '#4ECDC4';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-xl p-4"
      style={{ backgroundColor: `${bgColor}15` }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold">{account.name}</Text>
          <Text className="mt-0.5 text-sm text-neutral-500">
            {ACCOUNT_TYPE_LABELS[account.type as keyof typeof ACCOUNT_TYPE_LABELS] || account.type}
          </Text>
        </View>
        <Text className="text-lg font-bold">
          {formatCurrency(account.balance, currency)}
        </Text>
      </View>
    </Pressable>
  );
}
