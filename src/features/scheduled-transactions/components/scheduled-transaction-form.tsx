import type { ScheduledTransactionFormData, ScheduledTransactionFrequency } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import { useForm, useStore } from '@tanstack/react-form';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { Card, Chip, FlagCircle, Input, ListRow, SolidButton, Text, useModalSheet } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import { ChevronDown, ChevronRight, X } from '@/components/ui/icon';
import { NAV_BAR_HEIGHT } from '@/components/ui/nav-tab-bar';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useAccounts } from '@/features/accounts/api';
import { useCategories } from '@/features/categories/api';
import { CategoryPicker } from '@/features/categories/category-picker';
import { fitCategoryToType, fitsTransactionType, translateCount } from '@/features/categories/helpers';
import { CURRENCIES_MAP, CURRENCY_VALUES } from '@/features/currencies';
import { CurrencySheet } from '@/features/currencies/components/currency-sheet';
import { formatDate, formatDateFull, todayISO } from '@/features/formatting/helpers';
import { FormDataGate } from '@/features/transactions/components/form-data-gate';
import { AccountRow, RowError, RowLabel } from '@/features/transactions/components/transaction-form-fields';
import { cn } from '@/lib/cn';
import { dateToUnix, isValidISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';
import {
  addLastUsedCurrency,
  selectTransactionFormPrefs,
  setTransactionFormPrefs,
  useAppStore,
} from '@/lib/store/store';
import {
  useCreateScheduledTransaction,
  useUpdateScheduledTransaction,
} from '../api';
import { FREQUENCY_OPTIONS } from '../constants';
import { getFirstDueOnOrAfter } from '../scheduler';

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
    start_date: z.string().min(1, translate('scheduled.start_date_required')).refine(isValidISODate, translate('transactions.date_invalid')),
    end_date: z.string().nullable().refine((v) => v === null || isValidISODate(v), translate('transactions.date_invalid')),
    is_active: z.boolean(),
    source_transaction_id: z.string().optional(),
  })
  .refine(
    (value) => !value.end_date || value.end_date >= value.start_date,
    {
      message: translate('scheduled.end_date_invalid'),
      path: ['end_date'],
    },
  );

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

const HINT_DATE_FORMAT = 'EEE, MMM d';
const rowClassName = (first = false) => cn('min-h-[54px] py-0', !first && 'border-t border-border');
const rowInputClassName = 'h-auto min-w-[140px] rounded-none border-0 bg-transparent px-0 text-right text-row';
const selectSubmitted = (s: { submissionAttempts: number }) => s.submissionAttempts > 0;

export type ScheduledTransactionFormProps = {
  hasNav: boolean;
  initialValues?: ScheduledTransactionInitialValues;
  onCancel: () => void;
  onSuccess?: () => void;
};

function useScheduledTransactionForm(
  initialValues?: ScheduledTransactionInitialValues,
  onSuccess?: () => void,
) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createScheduledTransaction = useCreateScheduledTransaction();
  const updateScheduledTransaction = useUpdateScheduledTransaction();
  const id = initialValues?.id;

  const transactionFormPrefs = useAppStore(selectTransactionFormPrefs);

  const preferredType = transactionFormPrefs?.type === 'income' ? 'income' : defaultValues.type;
  const startValues = {
    ...defaultValues,
    type: preferredType,
    currency: transactionFormPrefs?.currency || defaultValues.currency,
    category_id: transactionFormPrefs?.category_id || '',
    account_id: transactionFormPrefs?.account_id || (accounts[0]?.id ?? ''),
    ...initialValues,
    amount: initialValues?.amount?.toString() || '',
  } as FormValues;

  const form = useForm({
    defaultValues: id ? startValues : fitCategoryToType(startValues, categories, { type: !!initialValues?.type, category: !!initialValues?.category_id }),
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const payload: ScheduledTransactionFormData = {
        ...value,
        amount: toNumber(value.amount) ?? 0,
        note: value.note || null,
        start_date: dateToUnix(value.start_date),
        end_date: value.end_date ? dateToUnix(value.end_date) : null,
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
    isEdit: !!id,
    accounts,
    isLoading: createScheduledTransaction.isPending || updateScheduledTransaction.isPending,
  };
}

type FormApi = ReturnType<typeof useScheduledTransactionForm>['form'];

function FormHeader({ form, onClose }: { form: FormApi; onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const type = useStore(form.store, (s) => s.values.type);
  const options = [
    { value: 'expense', label: translate('scheduled.form.bill') },
    { value: 'income', label: translate('common.income') },
  ] as const;
  const onChange = (next: FormValues['type']) => {
    form.setFieldValue('type', next);
    const selected = categories.find((c) => c.id === form.getFieldValue('category_id'));
    if (selected && !fitsTransactionType(selected, next)) form.setFieldValue('category_id', '');
  };

  return (
    <View className="px-5 pt-2">
      <PageHeader left={<HeaderButton icon={X} label={translate('common.close')} onPress={onClose} />}>
        <SegmentedControl
          className="min-w-0 flex-1"
          accessibilityLabel={translate('transactions.form.type')}
          options={options}
          value={type}
          onChange={onChange}
        />
      </PageHeader>
    </View>
  );
}

function AmountAndName({ form }: { form: FormApi }) {
  const currencyModal = useModalSheet();
  const submitted = useStore(form.store, selectSubmitted);
  return (
    <form.Field
      name="currency"
      children={(currencyField) => (
        <View className="items-center pt-8 pb-2">
          <form.Field
            name="amount"
            children={(field) => {
              const error = submitted ? getFieldError(field) : undefined;
              return (
                <>
                  <View className="max-w-full flex-row items-baseline justify-center gap-2 px-5">
                    <Text className="text-3xl font-semibold text-muted-foreground">{CURRENCIES_MAP[currencyField.state.value].symbol}</Text>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      accessibilityLabel={translate('transactions.amount')}
                      accessibilityHint={error}
                      autoFocus={!form.getFieldValue('amount')}
                      containerClassName="min-w-[120px] shrink"
                      className="h-auto rounded-none border-0 bg-transparent px-0 text-6xl font-bold tracking-tighter tabular-nums web:field-sizing-content"
                    />
                  </View>
                  {!!error && <Text className="pt-1 text-sm font-medium text-negative">{error}</Text>}
                </>
              );
            }}
          />
          <form.Field
            name="note"
            children={(field) => (
              <Input
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder={translate('scheduled.form.name_placeholder')}
                accessibilityLabel={translate('scheduled.form.name_placeholder')}
                containerClassName="w-full px-5"
                className="h-auto rounded-none border-0 bg-transparent px-0 text-center text-xl font-semibold"
              />
            )}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('common.currency')}
            onPress={currencyModal.present}
            className="mt-1 h-[34px] flex-row items-center gap-1.5 rounded-full bg-card pr-2.5 pl-[5px]"
          >
            <FlagCircle currency={currencyField.state.value} size={24} />
            <Text className="text-[13px] font-semibold">{currencyField.state.value}</Text>
            <ChevronDown size={14} colorClassName="accent-muted-foreground" />
          </Pressable>
          <CurrencySheet
            ref={currencyModal.ref}
            value={currencyField.state.value}
            stackBehavior="push"
            onSelect={currencyField.handleChange}
          />
        </View>
      )}
    />
  );
}

function FrequencyChips({ form }: { form: FormApi }) {
  return (
    <form.Field
      name="frequency"
      children={(field) => (
        <View className="px-5 pt-4">
          <Text className="pb-2.5 text-sm font-semibold">{translate('scheduled.repeats')}</Text>
          <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
            {FREQUENCY_OPTIONS.map((option) => {
              const selected = field.state.value === option.value;
              return (
                <Chip
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  label={option.label}
                  selected={selected}
                  tone="solid"
                  className={cn('h-11 px-4', !selected && 'bg-card')}
                  onPress={() => field.handleChange(option.value as ScheduledTransactionFrequency)}
                />
              );
            })}
          </View>
        </View>
      )}
    />
  );
}

function CategoryRow({ form }: { form: FormApi }) {
  const type = useStore(form.store, (s) => s.values.type);
  const submitted = useStore(form.store, selectSubmitted);
  const { data: categories = [] } = useCategories(type);
  return (
    <form.Field
      name="category_id"
      children={(field) => {
        const selected = categories.find((c) => c.id === field.state.value);
        return (
          <View className={cn(rowClassName(true), 'flex-row items-center gap-3')}>
            <View>
              <RowLabel>{translate('transactions.category')}</RowLabel>
              <RowError message={submitted ? getFieldError(field) : undefined} />
            </View>
            <CategoryPicker
              type={type}
              selectedId={field.state.value}
              onSelect={(category) => field.handleChange(category.id)}
              containerClassName="min-w-0 flex-1"
              inputClassName="h-[54px] border-0 bg-transparent px-0"
              showChevron={false}
              renderSelectedItem={() => (
                <View className="flex-1 flex-row items-center justify-end gap-3">
                  <Text className={cn('shrink text-row', !selected && 'text-muted-foreground')} numberOfLines={1}>
                    {selected ? `${selected.icon ?? ''} ${selected.name}`.trim() : translate('common.select')}
                  </Text>
                  <ChevronRight size={18} colorClassName="accent-muted-foreground" />
                </View>
              )}
            />
          </View>
        );
      }}
    />
  );
}

function DateRow({ label, value, onChange, placeholder, error, onClear }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  onClear?: () => void;
}) {
  return (
    <ListRow
      className={rowClassName()}
      title={<RowLabel>{label}</RowLabel>}
      meta={<RowError message={error} />}
      trailing={(
        <View className="flex-row items-center gap-1">
          <DateInput
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            accessibilityLabel={label}
            className={rowInputClassName}
            modalProps={{ stackBehavior: 'push' }}
            displayValue={isValidISODate(value) ? formatDate(dateToUnix(value)) : undefined}
          />
          {onClear
            ? (
                <Pressable accessibilityRole="button" accessibilityLabel={translate('scheduled.clear_end_date')} onPress={onClear} hitSlop={8}>
                  <X size={18} colorClassName="accent-muted-foreground" />
                </Pressable>
              )
            : <ChevronRight size={18} colorClassName="accent-muted-foreground" />}
        </View>
      )}
    />
  );
}

function DetailsCard({ form, accounts }: { form: FormApi; accounts: ReturnType<typeof useScheduledTransactionForm>['accounts'] }) {
  const type = useStore(form.store, (s) => s.values.type);
  const submitted = useStore(form.store, selectSubmitted);
  return (
    <Card className="mx-5 mt-[18px] rounded-card px-4">
      <CategoryRow form={form} />
      <form.Field
        name="account_id"
        children={(field) => (
          <AccountRow
            label={translate(type === 'income' ? 'transactions.form.to' : 'transactions.form.from')}
            accounts={accounts}
            value={field.state.value}
            onChange={field.handleChange}
            error={submitted ? getFieldError(field) : undefined}
          />
        )}
      />
      <form.Field
        name="start_date"
        children={(field) => (
          <DateRow
            label={translate('scheduled.form.starts')}
            value={field.state.value}
            onChange={field.handleChange}
            error={submitted ? getFieldError(field) : undefined}
          />
        )}
      />
      <form.Field
        name="end_date"
        children={(field) => (
          <DateRow
            label={translate('scheduled.form.ends')}
            value={field.state.value ?? ''}
            onChange={(value) => field.handleChange(value || null)}
            placeholder={translate('scheduled.form.never')}
            error={submitted ? getFieldError(field) : undefined}
            onClear={field.state.value ? () => field.handleChange(null) : undefined}
          />
        )}
      />
    </Card>
  );
}

function ScheduleHint({ form, isEdit }: { form: FormApi; isEdit: boolean }) {
  const values = useStore(form.store, (s) => s.values);
  const notifications = useAppStore.use.notifications();
  if (!isValidISODate(values.start_date) || (values.end_date && !isValidISODate(values.end_date))) return null;
  const firstDue = getFirstDueOnOrAfter({ startDate: values.start_date, frequency: values.frequency, targetDate: todayISO(), endDate: values.end_date });
  if (!firstDue) return null;

  const date = formatDateFull(dateToUnix(firstDue), HINT_DATE_FORMAT);
  const reminds = values.type === 'expense' && !!notifications.global && notifications.upcomingBills !== false;
  const text = [
    translate(isEdit ? 'scheduled.form.next_payment' : 'scheduled.form.first_payment', { date }),
    reminds ? translateCount('scheduled.form.reminder_hint', notifications.upcomingBillsDays ?? 7) : null,
  ].filter(Boolean).join(' ');
  return <Text className="px-7 pt-4 text-sm/snug text-muted-foreground">{text}</Text>;
}

export function ScheduledTransactionForm(props: ScheduledTransactionFormProps) {
  return (
    <FormDataGate onClose={props.onCancel}>
      <ScheduledTransactionFormContent {...props} />
    </FormDataGate>
  );
}

const FOOTER_HEIGHT = 56 + 16;

function ScheduledTransactionFormContent({
  hasNav,
  initialValues,
  onCancel,
  onSuccess,
}: ScheduledTransactionFormProps) {
  const { form, isEdit, accounts, isLoading } = useScheduledTransactionForm(initialValues, onSuccess);
  const insets = useSafeAreaInsets();
  const navOffset = hasNav ? NAV_BAR_HEIGHT : 0;
  const footerSpace = FOOTER_HEIGHT + insets.bottom + navOffset;

  return (
    <>
      <FormHeader form={form} onClose={onCancel} />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={footerSpace}
        extraKeyboardSpace={footerSpace}
        mode="layout"
        contentContainerStyle={{ paddingBottom: footerSpace }}
        keyboardShouldPersistTaps="handled"
      >
        <AmountAndName form={form} />
        <FrequencyChips form={form} />
        <DetailsCard form={form} accounts={accounts} />
        <ScheduleHint form={form} isEdit={isEdit} />
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom + navOffset }}>
        <form.Subscribe
          selector={(s) => s.isSubmitting}
          children={(isSubmitting) => (
            <View className="px-5 py-2">
              <SolidButton
                color="primary"
                size="lg"
                className="rounded-full"
                textClassName="text-base font-semibold"
                label={translate('scheduled.form.save')}
                loading={isSubmitting || isLoading}
                onPress={form.handleSubmit}
              />
            </View>
          )}
        />
      </KeyboardStickyView>
    </>
  );
}
