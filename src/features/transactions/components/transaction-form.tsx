import type { UseTransactionFormProps, UseTransactionFormReturnType } from '../hooks/form';
import type { OptionType } from '@/components/ui';
import type { Account } from '@/features/accounts/types';
import type { CurrencyKey } from '@/features/currencies';
import { ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, Image, Input, Select, SolidButton, Text } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import { CategoryPicker } from '@/features/categories/category-picker';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { TransactionBaseAmountSync } from '@/features/transactions/components/transaction-base-amount-sync';
import {
  TRANSACTION_TYPE_OPTIONS,
  transactionFormSchema,
} from '@/features/transactions/components/transaction-form-schema';
import { translate } from '@/lib/i18n';
import { useTransactionForm } from '../hooks/form';

export type TransactionFormBaseProps = UseTransactionFormProps & {
  bottomMenuOffset?: number;
  onCancel?: () => void;
};

type TransactionFormBodyProps = {
  form: UseTransactionFormReturnType['form'];
  isCompact: boolean;
  accounts: Account[];
  baseAmountIsManual: boolean;
  onBaseDriversChanged: () => void;
  orderedCurrencies: OptionType[];
  preferredCurrency: CurrencyKey;
  setBaseAmountIsManual: (value: boolean) => void;
};

function TransactionFormBody({
  form,
  isCompact,
  accounts,
  baseAmountIsManual,
  onBaseDriversChanged,
  orderedCurrencies,
  preferredCurrency,
  setBaseAmountIsManual,
}: TransactionFormBodyProps) {
  const inputSize = isCompact ? 'md' : 'lg';
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
                size={inputSize}
                showChevron={false}
                containerClassName="w-[105]"
                selectedItemTextProps={{ className: 'text-xl/tight' }}
                selectedItemClassName="justify-center"
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
                size={inputSize}
                keyboardType="decimal-pad"
                testID="amount-input"
                error={getFieldError(field)}
                containerClassName="min-w-[72] flex-1"
                className="justify-center px-3 text-xl"
                autoFocus
              />
            )}
          />
        </View>

        <form.Subscribe
          selector={(s) => [s.values.currency]}
          children={([selectedCurrency]) => selectedCurrency !== preferredCurrency && (
            <View className="mb-4 flex-row items-center gap-2">
              <View className="w-[105] flex-row items-center justify-center gap-2 p-2">
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
                    size="sm"
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
      <View className="flex-col gap-x-2 gap-y-4 3xs:flex-row">
        <form.Field
          name="date"
          children={(field) => (
            <DateInput
              size={inputSize}
              containerClassName="flex-1 min-w-[45%]"
              className="px-3"
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
              size={inputSize}
              containerClassName="flex-1 min-w-[45%]"
              inputClassName="px-3"
              showChevron={false}
              selectedItemTextProps={{ numberOfLines: 1 }}
              selectedId={field.state.value}
              onSelect={(cat) => field.handleChange(cat.id)}
              error={getFieldError(field)}
            />
          )}
        />
      </View>

      <form.Field
        name="account_id"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium">
              {translate('transactions.account')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {accounts.map((a) => (
                  <SolidButton
                    key={a.id}
                    size="sm"
                    className="items-center rounded-3xl"
                    color={field.state.value === a.id ? 'default' : 'secondary'}
                    label={`${a.icon} ${a.name}`}
                    onPress={() => field.handleChange(a.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
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
                  color={field.state.value === option.value ? 'default' : 'secondary'}
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
        name="note"
        children={(field) => (
          <Input
            value={field.state.value || ''}
            size={inputSize}
            className="mt-2 text-base/snug"
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            placeholder={translate('transactions.note_placeholder')}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="merchant_name"
        children={(field) => (
          <Input
            value={field.state.value || ''}
            size={inputSize}
            className="text-base/snug"
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            placeholder={translate('transactions.merchant_name_placeholder')}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="location"
        children={(field) => (
          <Input
            value={field.state.value || ''}
            size={inputSize}
            className="text-base/snug"
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            placeholder={translate('transactions.location_placeholder')}
            error={getFieldError(field)}
          />
        )}
      />
    </>
  );
}

export function TransactionForm({
  initialValues,
  onSuccess,
  onCancel,
  bottomMenuOffset = 0,
}: TransactionFormBaseProps) {
  const {
    form,
    isCompact,
    accounts,
    createTransaction,
    updateTransaction,
    baseAmountIsManual,
    onBaseDriversChanged,
    orderedCurrencies,
    preferredCurrency,
    setBaseAmountIsManual,
  } = useTransactionForm({ initialValues, onSuccess });

  const isLoading = createTransaction.isPending || updateTransaction.isPending;
  const insets = useSafeAreaInsets();
  const stickyFooterPadding = 56 + insets.bottom;
  const buttonSize = isCompact ? 'sm' : 'md';

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={stickyFooterPadding + bottomMenuOffset}
        extraKeyboardSpace={stickyFooterPadding + bottomMenuOffset}
        mode="layout"
        contentContainerStyle={{ gap: isCompact ? 8 : 12, paddingBottom: 8 + stickyFooterPadding, paddingHorizontal: 16, paddingTop: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <TransactionFormBody
          form={form}
          isCompact={isCompact}
          accounts={accounts}
          baseAmountIsManual={baseAmountIsManual}
          onBaseDriversChanged={onBaseDriversChanged}
          orderedCurrencies={orderedCurrencies}
          preferredCurrency={preferredCurrency}
          setBaseAmountIsManual={setBaseAmountIsManual}
        />
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom + bottomMenuOffset }}>
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
                  color="primary"
                  size={buttonSize}
                  textClassName="text-base/tight"
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
