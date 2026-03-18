import type { ScheduledTransactionFormData } from '../types';

import type { CurrencyKey } from '@/features/currencies';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { View } from 'react-native';
import * as z from 'zod';
import {
  Input,

  ScrollView,
  Select,
  SolidButton,
  Switch,
  Text,
} from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import { GhostButton } from '@/components/ui/ghost-button';
import { CategoryPicker } from '@/features/categories/category-picker';
import { CURRENCY_OPTIONS, CURRENCY_VALUES } from '@/features/currencies';
import { todayISO } from '@/features/formatting/helpers';
import { useAccounts } from '@/features/transactions/api';
import { dateToUnix } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';
import {
  addLastUsedCurrency,
  selectLastUsedCurrencies,
  selectTransactionFormPrefs,
  setTransactionFormPrefs,
  useAppStore,
} from '@/lib/store';
import { mergeCurrencyArrays } from '../../currencies/helpers';
import {
  useCreateScheduledTransaction,
  useUpdateScheduledTransaction,
} from '../api';
import { FREQUENCY_OPTIONS } from '../constants';

const schema = z
  .object({
    type: z.enum(['expense', 'income'] as const),
    currency: z.enum(CURRENCY_VALUES as CurrencyKey[]),
    amount: z
      .string()
      .min(1, translate('transactions.amount_required'))
      .refine((value) => {
        const amount = toNumber(value);
        return amount != null && amount > 0;
      }, translate('transactions.amount_required')),
    category_id: z.string().min(1, translate('transactions.category_required')),
    account_id: z.string().min(1, translate('transactions.account_required')),
    note: z.string().nullable(),
    frequency: z.enum([
      'daily',
      'weekly',
      'biweekly',
      'monthly',
      'yearly',
    ] as const),
    start_date: z.string().min(1, translate('scheduled.start_date_required')),
    end_date: z.string().nullable(),
    is_active: z.boolean(),
  })
  .refine(
    (value) =>
      !value.end_date || value.end_date >= value.start_date,
    {
      message: translate('scheduled.end_date_invalid'),
      path: ['end_date'],
    },
  );

const TYPE_OPTIONS = [
  { label: translate('common.expense'), value: 'expense' },
  { label: translate('common.income'), value: 'income' },
] as const;

type FormValues = z.infer<typeof schema>;
type InitialValues = Omit<Partial<FormValues>, 'amount'> & {
  amount?: number | string;
  id?: string;
};

const defaultValues = {
  type: 'expense',
  currency: 'USD',
  amount: '',
  category_id: '',
  account_id: '',
  note: null,
  frequency: 'monthly',
  start_date: todayISO(),
  end_date: null,
  is_active: true,
} satisfies FormValues;

export type ScheduledTransactionFormProps = {
  initialValues?: InitialValues;
  onCancel?: () => void;
  onSuccess?: () => void;
};

// eslint-disable-next-line max-lines-per-function
export function ScheduledTransactionForm({
  initialValues,
  onCancel,
  onSuccess,
}: ScheduledTransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const createScheduledTransaction = useCreateScheduledTransaction();
  const updateScheduledTransaction = useUpdateScheduledTransaction();
  const id = initialValues?.id;

  const transactionFormPrefs = useAppStore(selectTransactionFormPrefs);
  const lastUsedCurrencies = useAppStore(selectLastUsedCurrencies);
  const orderedCurrencies = React.useMemo(
    () => mergeCurrencyArrays(lastUsedCurrencies, CURRENCY_OPTIONS),
    [lastUsedCurrencies],
  );

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      type: transactionFormPrefs?.type || defaultValues.type,
      currency: transactionFormPrefs?.currency || defaultValues.currency,
      category_id: transactionFormPrefs?.category_id || '',
      account_id: transactionFormPrefs?.account_id || (accounts[0]?.id ?? ''),
      ...initialValues,
      amount: initialValues?.amount?.toString() || '',
    } as FormValues,
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      const payload: ScheduledTransactionFormData = {
        ...value,
        amount: toNumber(value.amount) ?? 0,
        note: value.note || null,
        start_date: dateToUnix(new Date(value.start_date)),
        end_date: value.end_date ? dateToUnix(new Date(value.end_date)) : null,
      };

      if (id) {
        await updateScheduledTransaction.mutateAsync({ id, data: payload });
      }
      else {
        await createScheduledTransaction.mutateAsync(payload);
        form.reset();
      }

      setTransactionFormPrefs({
        type: payload.type,
        currency: payload.currency,
        category_id: payload.category_id,
        account_id: payload.account_id,
      });
      addLastUsedCurrency(payload.currency);
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
              {accounts.map((account) => (
                <SolidButton
                  key={account.id}
                  size="sm"
                  className="items-center rounded-3xl"
                  color={field.state.value === account.id ? 'primary' : 'secondary'}
                  label={`${account.icon} ${account.name}`}
                  onPress={() => field.handleChange(account.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      />

      <form.Field
        name="category_id"
        children={(field) => (
          <CategoryPicker
            selectedId={field.state.value}
            onSelect={(category) => field.handleChange(category.id)}
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

      <form.Field
        name="frequency"
        children={(field) => (
          <Select
            label={translate('scheduled.frequency')}
            value={field.state.value}
            options={FREQUENCY_OPTIONS}
            onSelect={(value) => field.handleChange(String(value) as FormValues['frequency'])}
            stackBehavior="push"
          />
        )}
      />

      <View className="flex-row gap-3">
        <form.Field
          name="start_date"
          children={(field) => (
            <View className="flex-1">
              <DateInput
                label={translate('common.start_date')}
                value={field.state.value}
                onChange={field.handleChange}
                error={getFieldError(field)}
                modalProps={{ stackBehavior: 'push' }}
              />
            </View>
          )}
        />

        <form.Field
          name="end_date"
          children={(field) => (
            <View className="flex-1 gap-2">
              <DateInput
                label={translate('common.end_date')}
                value={field.state.value || ''}
                onChange={field.handleChange}
                error={getFieldError(field)}
                modalProps={{ stackBehavior: 'push' }}
              />
              {field.state.value && (
                <GhostButton
                  color="secondary"
                  size="sm"
                  label={translate('scheduled.clear_end_date')}
                  onPress={() => field.handleChange(null)}
                />
              )}
            </View>
          )}
        />
      </View>

      <form.Field
        name="is_active"
        children={(field) => (
          <View className="mt-2 flex-row">
            <Switch
              checked={field.state.value}
              onChange={field.handleChange}
              label={translate('scheduled.active')}
              accessibilityLabel={translate('scheduled.active')}
            />
          </View>
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
              loading={
                (!!state.isSubmitting)
                || createScheduledTransaction.isPending
                || updateScheduledTransaction.isPending
              }
              disabled={!schema.safeParse(state.values).success}
              className="flex-1"
            />
          </View>
        )}
      />
    </View>
  );
}
