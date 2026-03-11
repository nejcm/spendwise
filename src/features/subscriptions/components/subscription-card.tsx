import type { RecurringRuleWithCategory } from '../types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAppStore } from '@/lib/store';

import { FREQUENCY_LABELS } from '../types';

type Props = {
  rule: RecurringRuleWithCategory;
  onDelete: () => void;
};

export function SubscriptionCard({ rule, onDelete }: Props) {
  const currency = useAppStore.use.currency();
  const isIncome = rule.type === 'income';

  return (
    <View className="mb-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            {rule.category_color && (
              <View className="size-3 rounded-full" style={{ backgroundColor: rule.category_color }} />
            )}
            <Text className="text-base font-semibold">
              {rule.payee || rule.category_name || 'Recurring'}
            </Text>
          </View>
          <Text className="mt-0.5 text-sm text-neutral-500">
            {FREQUENCY_LABELS[rule.frequency]}
            {' '}
            · Next:
            {formatDate(rule.next_due_date)}
          </Text>
        </View>
        <View className="items-end">
          <Text className={`text-base font-bold ${isIncome ? 'text-success-600' : 'text-danger-500'}`}>
            {isIncome ? '+' : '-'}
            {formatCurrency(rule.amount, currency)}
          </Text>
          <Pressable onPress={onDelete} hitSlop={8}>
            <Text className="mt-1 text-xs text-neutral-400">Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
