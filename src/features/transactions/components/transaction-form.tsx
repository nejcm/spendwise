import type { UseTransactionFormReturnType } from '../hooks/form';
import type { OptionType } from '@/components/ui';
import type { Account } from '@/features/accounts/types';
import type { CurrencyKey } from '@/features/currencies';
import type { TransactionFormInitialValues } from '@/features/transactions/components/transaction-form-schema';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ScrollView, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, Input, OutlineButton, Select, SolidButton, Text } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import BottomSheetKeyboardAwareScrollView from '@/components/ui/modal-keyboard-aware-scroll-view';
import { CategoryPicker } from '@/features/categories/category-picker';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { TransactionBaseAmountSync } from '@/features/transactions/components/transaction-base-amount-sync';
import {
  TRANSACTION_TYPE_OPTIONS,
  transactionFormSchema,
} from '@/features/transactions/components/transaction-form-schema';
import { translate } from '@/lib/i18n';
import { useTransactionForm } from '../hooks/form';

export type TransactionFormProps = {
  initialValues?: TransactionFormInitialValues;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type TransactionFormBodyProps = {
  form: UseTransactionFormReturnType['form'];
  accounts: Account[];
  baseAmountIsManual: boolean;
  onBaseDriversChanged: () => void;
  orderedCurrencies: OptionType[];
  preferredCurrency: CurrencyKey;
  setBaseAmountIsManual: (value: boolean) => void;
  isSheet?: boolean;
};
function TransactionFormBody({
  form,
  accounts,
  baseAmountIsManual,
  onBaseDriversChanged,
  orderedCurrencies,
  preferredCurrency,
  setBaseAmountIsManual,
  isSheet,
}: TransactionFormBodyProps) {
  const HScrollView = isSheet ? BottomSheetScrollView : ScrollView;
  return (
    <>
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

      <View>
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
                size="xl"
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
                size="xl"
                keyboardType="decimal-pad"
                testID="amount-input"
                error={getFieldError(field)}
                containerClassName="min-w-[72] flex-1"
                className="px-3 text-2xl"
                autoFocus
              />
            )}
          />
        </View>

        <form.Subscribe
          selector={(s) => [s.values.currency]}
          children={([selectedCurrency]) => selectedCurrency !== preferredCurrency && (
            <View className="mb-2 flex-row items-center gap-2">
              <View className="w-[100] flex-row items-center justify-center gap-2 px-4">
                <Image source={CURRENCY_IMAGES[preferredCurrency]} className="size-6 rounded-full" />
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
                    size="lg"
                    readOnly={selectedCurrency === preferredCurrency}
                    keyboardType="decimal-pad"
                    testID="base-amount-input"
                    error={getFieldError(field)}
                    containerClassName="min-w-[72] flex-1"
                    className="border-0 bg-transparent px-3"
                  />
                )}
              />
            </View>
          )}
        />
      </View>

      <form.Field
        name="date"
        children={(field) => (
          <DateInput
            size="lg"
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
            size="lg"
            selectedId={field.state.value}
            onSelect={(cat) => field.handleChange(cat.id)}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="type"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium">
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
        name="note"
        children={(field) => (
          <Input
            value={field.state.value || ''}
            size="lg"
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            placeholder={translate('common.note')}
            error={getFieldError(field)}
          />
        )}
      />
    </>
  );
}

export function TransactionForm({ initialValues, onSuccess, onCancel }: TransactionFormProps) {
  const {
    form,
    accounts,
    createTransaction,
    updateTransaction,
    baseAmountIsManual,
    onBaseDriversChanged,
    orderedCurrencies,
    preferredCurrency,
    setBaseAmountIsManual,
  } = useTransactionForm(initialValues, onSuccess);

  return (
    <View className="flex-1 gap-4">
      <TransactionFormBody
        form={form}
        accounts={accounts}
        baseAmountIsManual={baseAmountIsManual}
        onBaseDriversChanged={onBaseDriversChanged}
        orderedCurrencies={orderedCurrencies}
        preferredCurrency={preferredCurrency}
        setBaseAmountIsManual={setBaseAmountIsManual}
        isSheet={false}
      />
      <View className="mt-auto flex-row gap-3 pt-4">
        <form.Subscribe
          selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
          children={(state) => (
            <>
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
            </>
          )}
        />
      </View>
    </View>
  );
}

export type TransactionFormSheetProps = TransactionFormProps;
export function TransactionFormSheet({
  initialValues,
  onSuccess,
  onCancel,
}: TransactionFormSheetProps) {
  const {
    form,
    accounts,
    createTransaction,
    updateTransaction,
    baseAmountIsManual,
    onBaseDriversChanged,
    orderedCurrencies,
    preferredCurrency,
    setBaseAmountIsManual,
  } = useTransactionForm(initialValues, onSuccess);

  const isLoading = createTransaction.isPending || updateTransaction.isPending;
  const insets = useSafeAreaInsets();

  return (
    <>
      <BottomSheetKeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 8, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <TransactionFormBody
          form={form}
          accounts={accounts}
          baseAmountIsManual={baseAmountIsManual}
          onBaseDriversChanged={onBaseDriversChanged}
          orderedCurrencies={orderedCurrencies}
          preferredCurrency={preferredCurrency}
          setBaseAmountIsManual={setBaseAmountIsManual}
          isSheet={true}
        />
      </BottomSheetKeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View className="flex-row gap-3 border-t border-border bg-background px-4 py-2">
          <form.Subscribe
            selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
            children={(state) => (
              <>
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
                  loading={(!!state.isSubmitting) || isLoading}
                  disabled={!transactionFormSchema.safeParse(state.values).success}
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
