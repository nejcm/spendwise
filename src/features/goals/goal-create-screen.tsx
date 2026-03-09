import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

import { useCreateGoal } from './api';

import { GOAL_COLORS } from './types';

export function GoalCreateScreen() {
  const router = useRouter();
  const createGoal = useCreateGoal();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const handleSubmit = () => {
    if (!name.trim() || !targetAmount) {
      return;
    }
    createGoal.mutate(
      { name, target_amount: targetAmount, deadline, color },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <Input
          label={translate('goals.goal_name')}
          value={name}
          onChangeText={setName}
          placeholder={translate('goals.name_placeholder')}
        />

        <View className="mt-4">
          <Input
            label={translate('goals.target_amount')}
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        <View className="mt-4">
          <Input
            label={translate('goals.deadline')}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD (optional)"
          />
        </View>

        <View className="mt-4">
          <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {translate('accounts.color')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {GOAL_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                className={`size-8 rounded-full ${color === c ? 'border-2 border-primary-400' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </View>
        </View>

        <View className="mt-6 mb-8 flex-row gap-3">
          <Button
            label={translate('common.cancel')}
            variant="outline"
            onPress={() => router.back()}
            className="flex-1"
          />
          <Button
            label={translate('common.save')}
            onPress={handleSubmit}
            disabled={!name.trim() || !targetAmount || createGoal.isPending}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </View>
  );
}
