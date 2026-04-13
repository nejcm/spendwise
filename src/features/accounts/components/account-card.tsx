import type { AccountWithBalance } from '@/features/accounts/types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { DEFAULT_COLOR } from '@/components/color-selector';

import { FormattedCurrency, getPressedStyle, Text } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { scaleBudgetForPeriod } from '@/lib/date/helpers';
import { useAppStore } from '@/lib/store';
import { hexWithOpacity } from '@/lib/theme/colors';
import { ACCOUNT_TYPE_LABELS } from '../types';

export type AccountCardProps = {
  account: AccountWithBalance;
  onPress?: () => void;
};

export function AccountCard({ account, onPress }: AccountCardProps) {
  const userCurrency = useAppStore.use.currency();
  const periodSelection = useAppStore.use.periodSelection();
  const scaledBudget = account.budget != null ? scaleBudgetForPeriod(account.budget, periodSelection) : null;
  const isMonthView = periodSelection.mode === 'month';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-xl bg-card p-4"
      style={getPressedStyle}
    >
      <View className="flex-row items-center justify-between gap-3">
        {account.icon && (
          <View
            className="size-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: hexWithOpacity(account.color ?? DEFAULT_COLOR, 26) }}
          >
            <Text className="text-3xl">{account.icon}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base/snug">{account.name}</Text>
          <Text className="text-sm text-muted-foreground">
            {ACCOUNT_TYPE_LABELS[account.type as keyof typeof ACCOUNT_TYPE_LABELS] || account.type}
          </Text>
        </View>
        <View className="items-end">
          <FormattedCurrency value={account.baseBalance} currency={userCurrency} className="text-lg font-bold" />
        </View>
      </View>
      {account.budget != null && account.budget > 0 && account.monthlyExpense != null && periodSelection.mode !== 'all' && (
        <BudgetProgressBar
          spent={account.monthlyExpense}
          budget={scaledBudget ?? 0}
          monthlyBudget={!isMonthView ? account.budget : undefined}
          currency={userCurrency}
          className="mt-2"
          showValues={true}
          bg="bg-muted-foreground/30"
        />
      )}
    </Pressable>
  );
}
