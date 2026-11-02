import type { UseTransactionFormProps, UseTransactionFormReturnType } from '../hooks/form';
import type { OptionType } from '@/components/ui';
import type { Account } from '@/features/accounts/types';
import type { CurrencyKey } from '@/features/currencies';
import type { TransactionType } from '@/features/transactions/types';
import { useStore } from '@tanstack/react-form';
import { ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, Image, Input, Select, SolidButton, Text } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import { useCategories } from '@/features/categories/api';
import { CategoryPicker } from '@/features/categories/category-picker';
import { fitsTransactionType } from '@/features/categories/helpers';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { TransactionBaseAmountSync } from '@/features/transactions/components/transaction-base-amount-sync';
import { transactionFormSchema } from '@/features/transactions/components/transaction-form-schema';
import { translate } from '@/lib/i18n';
import { useTransactionForm } from '../hooks/form';

export type TransactionFormBaseProps = UseTransactionFormProps & {
  bottomMenuOffset?: number;
  /** Opening-balance row: only amount, currency, date and text fields are editable. */
  isAdjustment?: boolean;
  onCancel?: () => void;
};

type TransactionFormBodyProps = {
  form: UseTransactionFormReturnType['form'];
  isCompact: boolean;
  isAdjustment: boolean;
  accounts: Account[];
  baseAmountIsManual: boolean;
  onBaseDriversChanged: () => void;
  orderedCurrencies: OptionType[];
  preferredCurrency: CurrencyKey;
  setBaseAmountIsManual: (value: boolean) => void;
  typeOptions: UseTransactionFormReturnType['typeOptions'];
};

function AccountChips({ label, accounts, value, onChange, error }: {
  label: string;
  accounts: Account[];
  value: string | null;
  onChange: (id: string) => void;
  error?: string;
}) {
  return (
    <View>
      <Text className="mb-2 text-sm font-medium">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {accounts.map((a) => (
            <SolidButton
              key={a.id}
              size="sm"
              className="items-center rounded-3xl"
              color={value === a.id ? 'default' : 'secondary'}
              label={a.icon ? `${a.icon} ${a.name}` : a.name}
              onPress={() => onChange(a.id)}
            />
          ))}
        </View>
      </ScrollView>
      {!!error && <Text className="mt-1 text-sm text-danger-600">{error}</Text>}
    </View>
  );
}

function TypeChips({ options, value, onChange }: {
  options: UseTransactionFormReturnType['typeOptions'];
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}) {
  return (
    <View>
      <Text className="mb-2 text-sm font-medium">{translate('transactions.type')}</Text>
      <View className="flex-row gap-2">
        {options.map((option) => (
          <SolidButton
            key={option.value}
            size="sm"
            className="items-center rounded-3xl"
            color={value === option.value ? 'default' : 'secondary'}
            label={option.label}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function TransactionFormBody({
  form,
  isCompact,
  isAdjustment,
  accounts,
  baseAmountIsManual,
  onBaseDriversChanged,
  orderedCurrencies,
  preferredCurrency,
  setBaseAmountIsManual,
  typeOptions,
}: TransactionFormBodyProps) {
  const { data: categories = [] } = useCategories();
  const type = useStore(form.store, (s) => s.values.type);
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
        {!isAdjustment && (
          <form.Field
            name="category_id"
            children={(field) => (
              <CategoryPicker
                type={type}
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
        )}
      </View>

      {!isAdjustment && (
        <form.Subscribe
          selector={(s) => s.values.type === 'transfer' && s.values.to_account_id !== null}
          children={(isPairedTransfer) => (
            <>
              <form.Field
                name="account_id"
                children={(field) => (
                  <AccountChips
                    label={translate(isPairedTransfer ? 'transactions.from_account' : 'transactions.account')}
                    accounts={accounts}
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                )}
              />
              {isPairedTransfer && (
                <form.Field
                  name="to_account_id"
                  children={(field) => (
                    <AccountChips
                      label={translate('transactions.to_account')}
                      accounts={accounts}
                      value={field.state.value}
                      onChange={field.handleChange}
                      error={getFieldError(field)}
                    />
                  )}
                />
              )}
            </>
          )}
        />
      )}

      {!isAdjustment && (
        <form.Field
          name="type"
          children={(field) => (
            <TypeChips
              options={typeOptions}
              value={field.state.value}
              onChange={(next) => {
                field.handleChange(next);
                const selected = categories.find((c) => c.id === form.getFieldValue('category_id'));
                if (selected && !fitsTransactionType(selected, next)) form.setFieldValue('category_id', '');
              }}
            />
          )}
        />
      )}

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
  isAdjustment = false,
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
    typeOptions,
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
          isAdjustment={isAdjustment}
          accounts={accounts}
          baseAmountIsManual={baseAmountIsManual}
          onBaseDriversChanged={onBaseDriversChanged}
          orderedCurrencies={orderedCurrencies}
          preferredCurrency={preferredCurrency}
          setBaseAmountIsManual={setBaseAmountIsManual}
          typeOptions={typeOptions}
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
