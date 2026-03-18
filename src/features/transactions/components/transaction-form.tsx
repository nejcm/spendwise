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
import { dateToUnix } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';
import { addLastUsedCurrency, selectLastUsedCurrencies, selectTransactionFormPrefs, setTransactionFormPrefs, useAppStore } from '@/lib/store';
import { mergeCurrencyArrays } from '../../currencies/helpers';

const schema = z.object({
  type: z.enum(['expense', 'income', 'transfer'] as TransactionType[]),
  currency: z.enum(CURRENCY_VALUES as CurrencyKey[]),
  amount: z.string().min(1, translate('transactions.amount_required')).refine((v) => {
    const n = toNumber(v);
    return n != null && n > 0;
  }, translate('transactions.amount_required')),
  category_id: z.string().min(1, 'Category is required'),
  account_id: z.string().min(1, 'Account is required'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().nullable(),
});

const TYPE_OPTIONS: { label: string; value: 'expense' | 'income' }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

type TransactionFormData = z.infer<typeof schema>;

type InitialValues = Omit<Partial<TransactionFormData>, 'amount'> & { amount?: number | string; id?: string };

export type TransactionFormProps = {
  initialValues?: InitialValues;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const defaultValues = {
  type: 'expense',
  currency: 'USD',
  category_id: '',
  account_id: '',
  date: todayISO(),
  amount: '',
  note: null,
} satisfies TransactionFormData;

export function TransactionForm({ initialValues, onSuccess, onCancel }: TransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const id = initialValues?.id;
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const lastUsedCurrencies = useAppStore(selectLastUsedCurrencies);
  const orderedCurrencies = React.useMemo(() => mergeCurrencyArrays(lastUsedCurrencies, CURRENCY_OPTIONS), [lastUsedCurrencies]);
  const transactionFormPrefs = useAppStore(selectTransactionFormPrefs);

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      type: transactionFormPrefs?.type || defaultValues.type,
      currency: transactionFormPrefs?.currency || defaultValues.currency,
      category_id: transactionFormPrefs?.category_id || '',
      account_id: transactionFormPrefs?.account_id || (accounts[0]?.id ?? ''),
      ...initialValues,
      amount: initialValues?.amount?.toString() || '',
    } as TransactionFormData,
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      if (!value.account_id) return;
      const data = { ...value, amount: toNumber(value.amount) ?? 0, date: dateToUnix(new Date(value.date)) };
      if (id) {
        await updateTransaction.mutateAsync({ id, data });
      }
      else {
        await createTransaction.mutateAsync(data);
        form.reset();
      }
      setTransactionFormPrefs({
        type: data.type,
        currency: data.currency,
        category_id: data.category_id,
        account_id: data.account_id,
      });
      addLastUsedCurrency(data.currency);
      onSuccess?.();
    },
  });

  return (
    <View className="gap-4">
      <View className="mb-4 flex-row gap-3">
        <form.Field
          name="currency"
          children={(field) => (
            <Select
              value={field.state.value}
              options={orderedCurrencies}
              searchEnabled
              onSelect={(value) => {
                if (!value) return;
                field.handleChange(String(value) as CurrencyKey);
              }}
              size="lg"
              showChevron={false}
              containerClassName="w-[100]"
              inputClassName="px-2"
              stackBehavior="push"
            />
          )}
        />
        <form.Field
          name="amount"
          children={(field) => (
            <Input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              placeholder="0.00"
              size="lg"
              keyboardType="decimal-pad"
              testID="amount-input"
              error={getFieldError(field)}
              containerClassName="flex-1"
            />
          )}
        />
      </View>

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
          <View className="mt-6 flex-row gap-3">
            {onCancel && (
              <GhostButton
                label={translate('common.cancel')}
                onPress={onCancel}
                color="secondary"
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
