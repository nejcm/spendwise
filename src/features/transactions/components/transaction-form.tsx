import type { TransactionFormApi, UseTransactionFormProps, UseTransactionFormReturnType } from '../hooks/form';
import type { TransactionType } from '@/features/transactions/types';
import * as React from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { SolidButton } from '@/components/ui';
import { ScanLine, X } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useCategories } from '@/features/categories/api';
import { fitsTransactionType } from '@/features/categories/helpers';
import { TransactionBaseAmountSync } from '@/features/transactions/components/transaction-base-amount-sync';
import { translate } from '@/lib/i18n';
import { triggerScanPicker } from '@/lib/store/local-store';
import { useTransactionForm } from '../hooks/form';
import { FormDataGate } from './form-data-gate';
import { AmountField, CategorySection, DetailsCard } from './transaction-form-fields';

export type TransactionFormProps = UseTransactionFormProps & {
  onClose: () => void;
  bottomMenuOffset?: number;
};

const FOOTER_HEIGHT = 56 + 16;

function FormHeader({ form, typeOptions, isEdit, isAdjustment, onClose }: {
  form: TransactionFormApi;
  typeOptions: UseTransactionFormReturnType['typeOptions'];
  isEdit: boolean;
  isAdjustment: boolean;
  onClose: () => void;
}) {
  const { data: categories = [] } = useCategories();
  const onTypeChange = (next: TransactionType) => {
    form.setFieldValue('type', next);
    const selected = categories.find((c) => c.id === form.getFieldValue('category_id'));
    if (selected && !fitsTransactionType(selected, next)) form.setFieldValue('category_id', '');
  };

  return (
    <View className="px-5 pt-2">
      <PageHeader
        title={translate('transactions.edit_title')}
        left={<HeaderButton icon={X} label={translate('common.close')} onPress={onClose} />}
        right={isEdit ? undefined : <HeaderButton icon={ScanLine} label={translate('scan.button_label')} onPress={triggerScanPicker} />}
      >
        {!isAdjustment && typeOptions.length > 1
          ? (
              <form.Subscribe
                selector={(s) => s.values.type}
                children={(type) => (
                  <SegmentedControl
                    className="min-w-0 flex-1"
                    accessibilityLabel={translate('transactions.form.type')}
                    options={typeOptions}
                    value={type}
                    onChange={onTypeChange}
                  />
                )}
              />
            )
          : undefined}
      </PageHeader>
    </View>
  );
}

function FormFooter({ form, isEdit, isLoading }: { form: TransactionFormApi; isEdit: boolean; isLoading: boolean }) {
  return (
    <form.Subscribe
      selector={(s) => s.isSubmitting}
      children={(isSubmitting) => (
        <View className="flex-row gap-2.5 px-5 py-2">
          {!isEdit && (
            <SolidButton
              color="secondary"
              size="lg"
              className="rounded-full"
              textClassName="text-[15px] font-medium"
              label={translate('transactions.form.save_add_another')}
              disabled={isSubmitting || isLoading}
              onPress={() => form.handleSubmit({ addAnother: true })}
            />
          )}
          <SolidButton
            color="primary"
            size="lg"
            className="flex-1 rounded-full"
            textClassName="text-base font-semibold"
            label={translate('common.save')}
            loading={isSubmitting || isLoading}
            onPress={() => form.handleSubmit({ addAnother: false })}
          />
        </View>
      )}
    />
  );
}

export function TransactionForm(props: TransactionFormProps) {
  return (
    <FormDataGate onClose={props.onClose}>
      <TransactionFormContent {...props} />
    </FormDataGate>
  );
}

function TransactionFormContent({ initialValues, onSaved, onClose, bottomMenuOffset = 0, isAdjustment = false }: TransactionFormProps) {
  const {
    form,
    amountRef,
    isEdit,
    accounts,
    isLoading,
    baseAmountIsManual,
    onBaseDriversChanged,
    preferredCurrency,
    setBaseAmountIsManual,
    typeOptions,
  } = useTransactionForm({ initialValues, onSaved, isAdjustment });
  const insets = useSafeAreaInsets();
  const footerSpace = FOOTER_HEIGHT + insets.bottom + bottomMenuOffset;

  return (
    <>
      <FormHeader form={form} typeOptions={typeOptions} isEdit={isEdit} isAdjustment={isAdjustment} onClose={onClose} />
      <form.Subscribe
        selector={(s) => ({ amount: s.values.amount, currency: s.values.currency, date: s.values.date })}
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
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={footerSpace}
        extraKeyboardSpace={footerSpace}
        mode="layout"
        contentContainerStyle={{ paddingBottom: footerSpace }}
        keyboardShouldPersistTaps="handled"
      >
        <AmountField form={form} amountRef={amountRef} signed={isAdjustment} />
        {!isAdjustment && <CategorySection form={form} />}
        <form.Subscribe
          selector={(s) => s.values.currency !== preferredCurrency}
          children={(showBaseAmount) => (
            <DetailsCard
              form={form}
              accounts={accounts}
              isAdjustment={isAdjustment}
              showBaseAmount={showBaseAmount}
              onBaseAmountEdited={() => setBaseAmountIsManual(true)}
            />
          )}
        />
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom + bottomMenuOffset }}>
        <FormFooter form={form} isEdit={isEdit} isLoading={isLoading} />
      </KeyboardStickyView>
    </>
  );
}
