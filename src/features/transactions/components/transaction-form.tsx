import type { CurrencyKey } from '@/features/currencies';
import type { TransactionFormInitialValues, TransactionFormValues } from '@/features/transactions/components/transaction-form-schema';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';

import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { Image, Input, OutlineButton, Select, SolidButton, Text } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import { useAccounts } from '@/features/accounts/api';
import { CategoryPicker } from '@/features/categories/category-picker';
import { CURRENCIES_MAP, CURRENCY_OPTIONS } from '@/features/currencies';
import { mergeCurrencyArrays } from '@/features/currencies/helpers';
import { useCreateTransaction, useUpdateTransaction } from '@/features/transactions/api';
import { TransactionBaseAmountSync } from '@/features/transactions/components/transaction-base-amount-sync';
import {
  amountToString,
  TRANSACTION_TYPE_OPTIONS,
  transactionFormDefaultValues,
  transactionFormSchema,
} from '@/features/transactions/components/transaction-form-schema';
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

export type TransactionFormProps = {
  initialValues?: TransactionFormInitialValues;
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
};

// eslint-disable-next-line max-lines-per-function
export function TransactionForm({ initialValues, onSuccess, onCancel, isSheet }: TransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const id = initialValues?.id;
  const preferredCurrency = useAppStore.use.currency();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const lastUsedCurrencies = useAppStore(selectLastUsedCurrencies);
  const orderedCurrencies = React.useMemo(() => mergeCurrencyArrays(lastUsedCurrencies, CURRENCY_OPTIONS), [lastUsedCurrencies]);
  const transactionFormPrefs = useAppStore(selectTransactionFormPrefs);
  const [baseAmountIsManual, setBaseAmountIsManual] = React.useState(false);
  const onBaseDriversChanged = React.useCallback(() => {
    setBaseAmountIsManual(false);
  }, []);

  const form = useForm({
    defaultValues: {
      ...transactionFormDefaultValues,
      type: transactionFormPrefs?.type || transactionFormDefaultValues.type,
      currency: transactionFormPrefs?.currency || transactionFormDefaultValues.currency,
      category_id: transactionFormPrefs?.category_id || '',
      account_id: transactionFormPrefs?.account_id || (accounts[0]?.id ?? ''),
      ...initialValues,
      amount: amountToString(initialValues?.amount),
      baseAmount: amountToString(initialValues?.baseAmount),
      baseCurrency: preferredCurrency,
    } as TransactionFormValues,
    validators: {
      onChange: transactionFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!value.account_id) return;
      const data = {
        ...value,
        amount: toNumber(value.amount) ?? 0,
        baseAmount: toNumber(value.baseAmount) ?? 0,
        date: dateToUnix(new Date(value.date)),
      };
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

  const HScrollView = isSheet ? BottomSheetScrollView : ScrollView;
  return (
    <View className="gap-4">
      <form.Subscribe
        selector={(s) => ({
          amount: s.values.amount,
          currency: s.values.currency,
          date: s.values.date,
        })}
        children={(v) => (
          <TransactionBaseAmountSync
            form={form}
            amount={v.amount}
            currency={v.currency}
            date={v.date}
            baseAmountIsManual={baseAmountIsManual}
            onDriversChanged={onBaseDriversChanged}
          />
        )}
      />

      <View className="flex-row gap-2">
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
              containerClassName="w-[92]"
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
              containerClassName="min-w-[72] flex-1"
              autoFocus
            />
          )}
        />
      </View>

      <form.Subscribe
        selector={(s) => [s.values.currency]}
        children={([selectedCurrency]) => selectedCurrency !== preferredCurrency && (
          <View className="flex-row items-center gap-2">
            <View className="w-[92] flex-row items-center justify-center gap-2 px-4">
              <Image source={CURRENCIES_MAP[preferredCurrency].image} className="size-6 rounded-full" />
              <Text className="border-none bg-transparent">
                {preferredCurrency}
              </Text>
            </View>
            <form.Field
              name="baseAmount"
              children={(field) => (
                <Input
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChangeText={(t) => {
                    setBaseAmountIsManual(true);
                    field.handleChange(t);
                  }}
                  placeholder="0.00"
                  readOnly={selectedCurrency === preferredCurrency}
                  size="lg"
                  keyboardType="decimal-pad"
                  testID="base-amount-input"
                  error={getFieldError(field)}
                  containerClassName="min-w-[72] flex-1"
                />
              )}
            />
          </View>
        )}
      />

      <form.Field
        name="type"
        children={(field) => (
          <View>
            <Text className="mt-4 mb-2 text-sm font-medium">
              {translate('transactions.type')}
            </Text>
            <View className="flex-row gap-2">
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
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
            <HScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
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
              </View>
            </HScrollView>
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
              <OutlineButton
                label={translate('common.cancel')}
                onPress={onCancel}
                color="secondary"
              />
            )}
            <SolidButton
              label={translate('common.save')}
              onPress={form.handleSubmit}
              loading={(!!state.isSubmitting) || createTransaction.isPending || updateTransaction.isPending}
              disabled={!transactionFormSchema.safeParse(state.values).success}
              className="flex-1"
            />
          </View>
        )}
      />
    </View>
  );
}
