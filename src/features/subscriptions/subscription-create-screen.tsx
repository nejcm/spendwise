import type { FormAsyncValidateOrFn, FormValidateOrFn, ReactFormExtendedApi } from '@tanstack/react-form';
import type { RecurringFrequency } from './types';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import * as z from 'zod';
import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useAccounts, useCategories } from '@/features/transactions/api';
import { CategoryPicker } from '@/features/transactions/components/category-picker';
import { todayISO } from '@/lib/format';
import { translate } from '@/lib/i18n';
import { useCreateRecurringRule } from './api';
import { FREQUENCY_LABELS } from './types';

const schema = z.object({
  type: z.enum(['expense', 'income']),
  account_id: z.string().min(1, 'Account is required'),
  category_id: z.string().nullable(),
  amount: z.string().min(1, 'Amount is required'),
  payee: z.string(),
  note: z.string(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']),
});

type RecurringFormData = z.infer<typeof schema>;

const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

const defaultValues = {
  account_id: '',
  type: 'expense' as 'expense' | 'income',
  category_id: null as string | null,
  amount: '',
  payee: '',
  note: '',
  frequency: 'monthly' as RecurringFrequency,
} satisfies RecurringFormData;

type TForm = ReactFormExtendedApi<
  RecurringFormData,
FormValidateOrFn<RecurringFormData> | undefined,
FormValidateOrFn<RecurringFormData> | undefined,
FormAsyncValidateOrFn<RecurringFormData> | undefined,
FormValidateOrFn<RecurringFormData> | undefined,
FormAsyncValidateOrFn<RecurringFormData> | undefined,
FormValidateOrFn<RecurringFormData> | undefined,
FormAsyncValidateOrFn<RecurringFormData> | undefined,
FormValidateOrFn<RecurringFormData> | undefined,
FormAsyncValidateOrFn<RecurringFormData> | undefined,
FormAsyncValidateOrFn<RecurringFormData> | undefined,
any
>;

function SubscriptionCategorySection({
  typeValue,
  form,
}: {
  typeValue: 'expense' | 'income';
  form: TForm;
}) {
  const { data: categories = [] } = useCategories(typeValue);
  return (
    <View className="mt-4">
      <form.Field
        name="category_id"
        children={(field) => (
          <CategoryPicker
            categories={categories}
            selectedId={field.state.value}
            onSelect={(cat) => field.handleChange(cat.id)}
            label={translate('transactions.category')}
          />
        )}
      />
    </View>
  );
}

export function SubscriptionCreateScreen() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const createRule = useCreateRecurringRule();

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      account_id: accounts[0]?.id ?? '',
    },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      createRule.mutate(
        {
          account_id: value.account_id,
          category_id: value.category_id,
          type: value.type,
          amount: value.amount,
          note: value.note,
          payee: value.payee,
          frequency: value.frequency,
          start_date: todayISO(),
        },
        { onSuccess: () => router.back() },
      );
    },
  });

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <form.Field
          name="type"
          children={(field) => (
            <View className="mb-4 flex-row gap-2">
              <Pressable
                onPress={() => {
                  field.handleChange('expense');
                  form.setFieldValue('category_id', null);
                }}
                className={`flex-1 rounded-full py-2 ${field.state.value === 'expense' ? 'bg-danger-500' : 'bg-neutral-100 dark:bg-neutral-700'}`}
              >
                <Text className={`text-center text-sm font-semibold ${field.state.value === 'expense' ? 'text-white' : ''}`}>
                  {translate('transactions.expense')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  field.handleChange('income');
                  form.setFieldValue('category_id', null);
                }}
                className={`flex-1 rounded-full py-2 ${field.state.value === 'income' ? 'bg-success-600' : 'bg-neutral-100 dark:bg-neutral-700'}`}
              >
                <Text className={`text-center text-sm font-semibold ${field.state.value === 'income' ? 'text-white' : ''}`}>
                  {translate('transactions.income')}
                </Text>
              </Pressable>
            </View>
          )}
        />

        <form.Field
          name="amount"
          children={(field) => (
            <Input
              label={translate('transactions.amount')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={getFieldError(field)}
            />
          )}
        />

        <View className="mt-4">
          <form.Field
            name="account_id"
            children={(field) => (
              <>
                <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {translate('transactions.account')}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {accounts.map((a) => (
                    <Pressable
                      key={a.id}
                      onPress={() => field.handleChange(a.id)}
                      className={`rounded-full px-3 py-1.5 ${field.state.value === a.id ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                    >
                      <Text className={`text-sm ${field.state.value === a.id ? 'font-semibold text-white' : ''}`}>
                        {a.name}
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
            name="frequency"
            children={(field) => (
              <>
                <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {translate('subscriptions.frequency')}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {FREQUENCIES.map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => field.handleChange(f)}
                      className={`rounded-full px-3 py-1.5 ${field.state.value === f ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                    >
                      <Text className={`text-sm ${field.state.value === f ? 'font-semibold text-white' : ''}`}>
                        {FREQUENCY_LABELS[f]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          />
        </View>

        <form.Subscribe selector={(state) => state.values.type}>
          {(typeValue) => (
            <SubscriptionCategorySection
              typeValue={typeValue as 'expense' | 'income'}
              form={form}
            />
          )}
        </form.Subscribe>

        <View className="mt-4">
          <form.Field
            name="payee"
            children={(field) => (
              <Input
                label={translate('transactions.payee')}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
              />
            )}
          />
        </View>

        <View className="mt-4">
          <form.Field
            name="note"
            children={(field) => (
              <Input
                label={translate('transactions.note')}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
              />
            )}
          />
        </View>

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values.amount, state.values.account_id]}
          children={([isSubmitting, amount, accountId]) => (
            <View className="mt-6 mb-8 flex-row gap-3">
              <Button label={translate('common.cancel')} variant="outline" onPress={() => router.back()} className="flex-1" />
              <Button
                label={translate('common.save')}
                onPress={form.handleSubmit}
                disabled={!(amount as string) || !(accountId as string) || createRule.isPending}
                loading={(isSubmitting as boolean) || createRule.isPending}
                className="flex-1"
              />
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}
