import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

import { useGoals } from './api';
import { GoalCard } from './components/goal-card';

export function GoalListScreen() {
  const router = useRouter();
  const { data: goals = [] } = useGoals();

  const active = goals.filter((g) => !g.is_completed);
  const completed = goals.filter((g) => g.is_completed);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        {active.length === 0 && completed.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-neutral-500">{translate('goals.no_goals')}</Text>
          </View>
        )}

        {active.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onPress={() => router.push(`/goals/${goal.id}` as any)}
          />
        ))}

        {completed.length > 0 && (
          <>
            <Text className="mt-4 mb-2 text-sm font-semibold text-neutral-500">
              {translate('goals.completed')}
            </Text>
            {completed.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onPress={() => router.push(`/goals/${goal.id}` as any)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <Pressable
        className="absolute right-6 bottom-6 size-14 items-center justify-center rounded-full bg-primary-400 shadow-lg"
        onPress={() => router.push('/goals/create' as any)}
      >
        <Text className="text-2xl font-bold text-white">+</Text>
      </Pressable>
    </View>
  );
}
