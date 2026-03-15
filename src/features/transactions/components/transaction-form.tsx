import type { TransactionType } from '../types';
import type { CurrencyKey } from '@/features/currencies';

import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { View } from 'react-native';
import * as z from 'zod';
import { Input, ScrollView, Select, SolidButton, Text } from '@/components/ui';

import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import { GhostButton } from '@/components/ui/ghost-button';
import { CategoryPicker } from '@/features/categories/category-picker';
import { CURRENCY_OPTIONS, CURRENCY_VALUES } from '@/features/currencies';
import { todayISO } from '@/features/formatting/helpers';
import { useAccounts, useCreateTransaction, useUpdateTransaction } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { setCurrency, useAppStore } from '@/lib/store';

const schema = z.object({
  type: z.enum(['expense', 'income', 'transfer'] as TransactionType[]),
  currency: z.enum(CURRENCY_VALUES as CurrencyKey[]),
  amount: z.number(),
  category_id: z.string().min(1, 'Category is required'),
  account_id: z.string().min(1, 'Account is required'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().nullable(),
});

const TYPE_OPTIONS: { label: string; value: 'expense' | 'income' }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

export type TransactionFormProps = {
  initialValues?: (Partial<TransactionFormData> & { id: never }) | (TransactionFormData & { id: string });
  onSuccess?: () => void;
  onCancel?: () => void;
};

type TransactionFormData = z.infer<typeof schema>;

const defaultValues = {
  type: 'expense',
  category_id: '',
  account_id: '',
  date: todayISO(),
  note: null,
} satisfies Partial<TransactionFormData>;

export function TransactionForm({ initialValues, onSuccess, onCancel }: TransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const id = initialValues?.id;
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const currency = useAppStore.use.currency();

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      account_id: accounts[0]?.id ?? '',
      ...initialValues,
    } as TransactionFormData,
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      if (!value.account_id)
        return;
      if (id) {
        await updateTransaction.mutateAsync({ id, data: value });
        onSuccess?.();
        return;
      }
      await createTransaction.mutateAsync(value);
      form.reset();
      onSuccess?.();
    },
  });

  return (
    <View className="gap-4">
      <form.Field
        name="type"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium">
              {translate('transactions.type')}
            </Text>
            <View className="flex-row gap-2">
              {TYPE_OPTIONS.map((option) => (
                <SolidButton
                  key={option.value}
                  size="sm"
                  className="items-center rounded-3xl"
                  color={field.state.value === option.value ? 'primary' : 'secondary'}
                  label={option.label}
                  onPress={() => {
                    field.handleChange(option.value);
                    form.setFieldValue('category_id', '');
                  }}
                />
              ))}
            </View>
          </View>
        )}
      />

      <form.Field
        name="account_id"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium">
              {translate('transactions.account')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="flex-row gap-2"
            >
              {accounts.map((a) => (
                <SolidButton
                  key={a.id}
                  size="sm"
                  className="items-center rounded-3xl"
                  color={field.state.value === a.id ? 'primary' : 'secondary'}
                  label={`${a.icon} ${a.name}`}
                  onPress={() => field.handleChange(a.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      />
      <View className="flex-row gap-3">
        <Select
          label={translate('transactions.currency')}
          value={currency}
          options={CURRENCY_OPTIONS}
          onSelect={(value) => {
            if (!value) return;
            setCurrency(String(value) as CurrencyKey);
          }}
          size="md"
          showChevron={false}
          containerClassName="w-[96]"
          stackBehavior="push"
        />
        <form.Field
          name="amount"
          children={(field) => (
            <Input
              label={translate('transactions.amount')}
              value={String(field.state.value)}
              onBlur={field.handleBlur}
              onChangeText={(val) => field.handleChange(Number(val))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              testID="amount-input"
              error={getFieldError(field)}
              containerClassName="flex-1"
            />
          )}
        />
      </View>

      <form.Field
        name="date"
        children={(field) => (
          <DateInput
            label={translate('transactions.date')}
            value={field.state.value}
            onChange={field.handleChange}
            error={getFieldError(field)}
            modalProps={{ stackBehavior: 'push' }}
          />
        )}
      />

      <form.Field
        name="category_id"
        children={(field) => (
          <CategoryPicker
            selectedId={field.state.value}
            onSelect={(cat) => field.handleChange(cat.id)}
            label={translate('transactions.category')}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="note"
        children={(field) => (
          <Input
            label={translate('transactions.note')}
            value={field.state.value || ''}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            placeholder={translate('common.note')}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Subscribe
        selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
        children={(state) => (
          <View className="flex-row gap-3">
            {onCancel && (
              <GhostButton
                label={translate('common.cancel')}
                onPress={onCancel}
                color="secondary-alt"
                className=""
              />
            )}
            <SolidButton
              label={translate('common.save')}
              onPress={form.handleSubmit}
              loading={(!!state.isSubmitting) || createTransaction.isPending || updateTransaction.isPending}
              disabled={!schema.safeParse(state.values).success}
              className="flex-1"
            />
          </View>
        )}
      />
    </View>
  );
}
