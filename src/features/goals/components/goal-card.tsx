import type { Goal } from '../types';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAppStore } from '@/lib/store';

type Props = {
  goal: Goal;
  onPress?: () => void;
};

export function GoalCard({ goal, onPress }: Props) {
  const currency = useAppStore.use.currency();
  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <Pressable onPress={onPress} className="mb-3 rounded-xl p-4" style={{ backgroundColor: `${goal.color}15` }}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold">{goal.name}</Text>
        {goal.is_completed
          ? <Text className="text-xs font-semibold text-success-600">✓ Complete</Text>
          : (
              <Text className="text-sm font-medium">
                {Math.round(progress)}
                %
              </Text>
            )}
      </View>

      <View className="mb-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <View
          className="h-2 rounded-full"
          style={{ width: `${progress}%`, backgroundColor: goal.color }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-xs text-neutral-500">
          {formatCurrency(goal.current_amount, currency)}
          {' '}
          saved
        </Text>
        <Text className="text-xs text-neutral-500">
          {goal.is_completed ? 'Goal reached!' : `${formatCurrency(remaining, currency)} to go`}
        </Text>
      </View>

      {goal.deadline && !goal.is_completed && (
        <Text className="mt-1 text-xs text-neutral-400">
          Deadline:
          {' '}
          {formatDate(goal.deadline)}
        </Text>
      )}
    </Pressable>
  );
}
