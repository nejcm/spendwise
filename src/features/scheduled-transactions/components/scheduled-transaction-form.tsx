import type { ScheduledTransactionFormData } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';
import {
  Input,
  OutlineButton,
  Select,
  SolidButton,
  Switch,
  Text,
} from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import { GhostButton } from '@/components/ui/ghost-button';
import { NAV_BAR_HEIGHT } from '@/components/ui/nav-tab-bar';
import { useAccounts } from '@/features/accounts/api';
import { CategoryPicker } from '@/features/categories/category-picker';
import { CURRENCY_VALUES } from '@/features/currencies';
import { CURRENCY_OPTIONS } from '@/features/currencies/images';
import { todayISO } from '@/features/formatting/helpers';
import { dateToUnix } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';
import {
  addLastUsedCurrency,
  selectLastUsedCurrencies,
  selectTransactionFormPrefs,
  setTransactionFormPrefs,
  useAppStore,
} from '@/lib/store/store';
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
    (value) => !value.end_date || value.end_date >= value.start_date,
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
export type ScheduledTransactionInitialValues = Omit<Partial<FormValues>, 'amount'> & {
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

export type ScheduledTransactionFormBaseProps = {
  hasNav: boolean;
  initialValues?: ScheduledTransactionInitialValues;
  onCancel?: () => void;
  onSuccess?: () => void;
};

function useScheduledTransactionForm(
  initialValues?: ScheduledTransactionInitialValues,
  onSuccess?: () => void,
) {
  const { data: accounts = [] } = useAccounts();
  const createScheduledTransaction = useCreateScheduledTransaction();
  const updateScheduledTransaction = useUpdateScheduledTransaction();
  const id = initialValues?.id;

  const transactionFormPrefs = useAppStore(selectTransactionFormPrefs);
  const lastUsedCurrencies = useAppStore(selectLastUsedCurrencies);
  const isCompact = useAppStore.use.density() === 'compact';
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
    validators: { onChange: schema },
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

  return {
    form,
    isCompact,
    accounts,
    createScheduledTransaction,
    updateScheduledTransaction,
    orderedCurrencies,
  };
}

type UseScheduledTransactionFormReturn = ReturnType<typeof useScheduledTransactionForm>;

type ScheduledTransactionFormBodyProps = {
  form: UseScheduledTransactionFormReturn['form'];
  isCompact: boolean;
  accounts: UseScheduledTransactionFormReturn['accounts'];
  orderedCurrencies: UseScheduledTransactionFormReturn['orderedCurrencies'];
};

function ScheduledTransactionFormBody({ form, isCompact, accounts, orderedCurrencies }: ScheduledTransactionFormBodyProps) {
  const inputSize = isCompact ? 'md' : 'lg';
  return (
    <>
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
              size={isCompact ? 'lg' : 'xl'}
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
              size={isCompact ? 'lg' : 'xl'}
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
                  color={field.state.value === option.value ? 'default' : 'secondary'}
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
          <View className="mb-2">
            <Text className="mb-2 text-sm font-medium">
              {translate('transactions.account')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {accounts.map((account) => (
                  <SolidButton
                    key={account.id}
                    size="sm"
                    className="items-center rounded-3xl"
                    color={field.state.value === account.id ? 'default' : 'secondary'}
                    label={`${account.icon} ${account.name}`}
                    onPress={() => field.handleChange(account.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      />

      <form.Field
        name="category_id"
        children={(field) => (
          <CategoryPicker
            size={inputSize}
            selectedId={field.state.value}
            onSelect={(category) => field.handleChange(category.id)}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="frequency"
        children={(field) => (
          <Select
            value={field.state.value}
            options={FREQUENCY_OPTIONS}
            onSelect={(value) => field.handleChange(String(value) as FormValues['frequency'])}
            stackBehavior="push"
            size={inputSize}
          />
        )}
      />

      <View className="flex-row items-start gap-2">
        <form.Field
          name="start_date"
          children={(field) => (
            <View className="flex-1">
              <DateInput
                value={field.state.value}
                onChange={field.handleChange}
                error={getFieldError(field)}
                placeholder={translate('common.start_date')}
                modalProps={{ stackBehavior: 'push' }}
                size={inputSize}
              />
            </View>
          )}
        />
        <Text className="py-3">-</Text>
        <form.Field
          name="end_date"
          children={(field) => (
            <View className="flex-1 gap-1">
              <DateInput
                value={field.state.value || ''}
                onChange={field.handleChange}
                error={getFieldError(field)}
                placeholder={translate('common.end_date')}
                modalProps={{ stackBehavior: 'push' }}
                size={inputSize}
              />
              {field.state.value && (
                <OutlineButton
                  color="secondary"
                  size="2xs"
                  className="rounded-3xl"
                  textClassName="text-xs"
                  label={translate('scheduled.clear_end_date')}
                  onPress={() => field.handleChange(null)}
                />
              )}
            </View>
          )}
        />
      </View>

      <form.Field
        name="note"
        children={(field) => (
          <Input
            value={field.state.value || ''}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            placeholder={translate('common.note')}
            error={getFieldError(field)}
            size={inputSize}
          />
        )}
      />

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
    </>
  );
}

export type ScheduledTransactionFormProps = ScheduledTransactionFormBaseProps;
export function ScheduledTransactionForm({
  hasNav,
  initialValues,
  onCancel,
  onSuccess,
}: ScheduledTransactionFormProps) {
  const {
    form,
    isCompact,
    accounts,
    createScheduledTransaction,
    updateScheduledTransaction,
    orderedCurrencies,
  } = useScheduledTransactionForm(initialValues, onSuccess);

  const isLoading = createScheduledTransaction.isPending || updateScheduledTransaction.isPending;
  const insets = useSafeAreaInsets();
  const bottomNavPadding = hasNav ? NAV_BAR_HEIGHT : 0;
  const stickyFooterPadding = bottomNavPadding + insets.bottom;
  const buttonSize = isCompact ? 'sm' : 'md';

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: insets.bottom, paddingHorizontal: 16, paddingTop: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScheduledTransactionFormBody
          isCompact={isCompact}
          form={form}
          accounts={accounts}
          orderedCurrencies={orderedCurrencies}
        />
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: stickyFooterPadding }}>
        <View className="flex-row gap-3 border-t border-border bg-background px-4 py-2">
          <form.Subscribe
            selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
            children={(state) => (
              <>
                {onCancel && (
                  <GhostButton
                    size={buttonSize}
                    textClassName="text-base/tight"
                    label={translate('common.cancel')}
                    onPress={onCancel}
                  />
                )}
                <SolidButton
                  size={buttonSize}
                  textClassName="text-base/tight"
                  color="primary"
                  label={translate('common.save')}
                  onPress={form.handleSubmit}
                  loading={
                    (!!state.isSubmitting)
                    || isLoading
                  }
                  disabled={!schema.safeParse(state.values).success}
                  className="flex-1"
                />
              </>
            )}
          />
        </View>
      </KeyboardStickyView>
    </>
  );
}
