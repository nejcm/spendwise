import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import * as z from 'zod';

import { FocusAwareStatusBar, Input, ScrollView, SolidButton, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { OutlineButton } from '@/components/ui/outline-button';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { useCreateGoal } from './api';
import { GOAL_COLORS } from './types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  target_amount: z.string().min(1, 'Target amount is required'),
  deadline: z.string(),
  color: z.string(),
});

const defaultValues = {
  name: '',
  target_amount: '',
  deadline: '',
  color: GOAL_COLORS[0],
};

export function GoalCreateScreen() {
  const router = useRouter();
  const createGoal = useCreateGoal();

  const form = useForm({
    defaultValues,
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      createGoal.mutate(
        { name: value.name, target_amount: value.target_amount, deadline: value.deadline, color: value.color },
        { onSuccess: () => router.back() },
      );
    },
  });

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        <form.Field
          name="name"
          children={(field) => (
            <Input
              label={translate('goals.goal_name')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              placeholder={translate('goals.name_placeholder')}
              error={getFieldError(field)}
            />
          )}
        />

        <View className="mt-4">
          <form.Field
            name="target_amount"
            children={(field) => (
              <Input
                label={translate('goals.target_amount')}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                error={getFieldError(field)}
              />
            )}
          />
        </View>

        <View className="mt-4">
          <form.Field
            name="deadline"
            children={(field) => (
              <Input
                label={translate('goals.deadline')}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder="YYYY-MM-DD (optional)"
                error={getFieldError(field)}
              />
            )}
          />
        </View>

        <View className="mt-4">
          <form.Field
            name="color"
            children={(field) => (
              <>
                <Text className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {translate('accounts.color')}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {GOAL_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => field.handleChange(c)}
                      className={`size-8 rounded-full ${field.state.value === c ? 'border-2 border-primary-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </View>
              </>
            )}
          />
        </View>

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values.name, state.values.target_amount]}
          children={([isSubmitting, name, targetAmount]) => (
            <View className="mt-6 mb-8 flex-row gap-3">
              <OutlineButton
                label={translate('common.cancel')}
                onPress={() => router.back()}
                className="flex-1"
              />
              <SolidButton
                label={translate('common.save')}
                onPress={form.handleSubmit}
                disabled={!(name as string).trim() || !(targetAmount as string) || createGoal.isPending}
                loading={(isSubmitting as boolean) || createGoal.isPending}
                className="flex-1"
              />
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}
