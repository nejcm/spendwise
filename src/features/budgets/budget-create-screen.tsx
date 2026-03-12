import type { BudgetPeriod } from './types';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import * as z from 'zod';
import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useCategories } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useCreateBudget } from './api';

const schema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  amount: z.string(),
  period: z.enum(['monthly', 'weekly', 'yearly']),
  lines: z.record(z.string(), z.string()),
});

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
];

const defaultValues = {
  name: '',
  amount: '',
  period: 'monthly' as BudgetPeriod,
  lines: {} as Record<string, string>,
};

const validators = {
  onChange: schema,
};

export function BudgetCreateScreen() {
  const router = useRouter();
  const { data: categories = [] } = useCategories('expense');
  const createBudget = useCreateBudget();

  const form = useForm({
    defaultValues,
    validators,
    onSubmit: async ({ value }) => {
      const lines = Object.entries(value.lines)
        .filter(([_, v]) => Number.parseFloat(v) > 0)
        .map(([categoryId, amt]) => ({ category_id: categoryId, amount: Number.parseFloat(amt) }));

      createBudget.mutate(
        { name: value.name.trim(), period: value.period, amount: Number.parseFloat(value.amount), lines },
        { onSuccess: () => router.back() },
      );
    },
  });

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <form.Field
          name="name"
          children={(field) => (
            <Input
              label={translate('budgets.budget_name')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              placeholder={translate('budgets.name_placeholder')}
              error={getFieldError(field)}
            />
          )}
        />

        <View className="mt-4">
          <form.Field
            name="period"
            children={(field) => (
              <>
                <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {translate('budgets.period')}
                </Text>
                <View className="flex-row gap-2">
                  {PERIODS.map((p) => (
                    <Pressable
                      key={p.value}
                      onPress={() => field.handleChange(p.value)}
                      className={`rounded-full px-3 py-1.5 ${field.state.value === p.value ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                    >
                      <Text className={`text-sm ${field.state.value === p.value ? 'font-medium text-white' : ''}`}>
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          />
        </View>

        <View className="mt-4">
          <form.Field
            name="amount"
            children={(field) => (
              <Input
                label={translate('budgets.total_amount')}
                value={field.state.value.toString()}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                error={getFieldError(field)}
              />
            )}
          />
        </View>

        <Text className="mt-6 mb-3 text-lg font-medium">
          {translate('budgets.category_budgets')}
        </Text>

        <form.Field
          name="lines"
          children={(field) => (
            <>
              {categories.map((cat) => (
                <View key={cat.id} className="mb-2 flex-row items-center gap-3">
                  <View className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <Text className="flex-1 text-sm">{cat.name}</Text>
                  <Input
                    className="w-24"
                    value={field.state.value[cat.id] ?? ''}
                    onChangeText={(v) => field.handleChange({ ...field.state.value, [cat.id]: v })}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>
              ))}
            </>
          )}
        />

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values.name, state.values.amount]}
          children={([isSubmitting, name, amount]) => (
            <View className="mt-6 mb-8 flex-row gap-3">
              <Button
                label={translate('common.cancel')}
                variant="outline"
                onPress={() => router.back()}
                className="flex-1"
              />
              <Button
                label={translate('common.save')}
                onPress={form.handleSubmit}
                disabled={!(name as string).trim() || !(amount as string) || createBudget.isPending}
                loading={(isSubmitting as boolean) || createBudget.isPending}
                className="flex-1"
              />
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}
