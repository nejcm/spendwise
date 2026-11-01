import type { TextInput } from 'react-native';
import type { TransactionFormInitialValues, TransactionFormValues } from '@/features/transactions/components/transaction-form-schema';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';

import * as React from 'react';
import { AccessibilityInfo } from 'react-native';
import { showSnackbar } from '@/components/ui/snackbar';
import { useAccounts } from '@/features/accounts/api';
import { useCategories } from '@/features/categories/api';
import { fitCategoryToType } from '@/features/categories/helpers';
import { todayISO } from '@/features/formatting/helpers';
import { useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from '@/features/transactions/api';
import {
  adjustmentFormSchema,
  amountToString,
  nextEntryValues,
  TRANSACTION_TYPE_OPTIONS,
  transactionFormDefaultValues,
  transactionFormSchema,
} from '@/features/transactions/components/transaction-form-schema';
import { savedSnackbar } from '@/features/transactions/helpers';
import { dateToUnix } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';
import {
  addLastUsedCurrency,
  selectTransactionFormPrefs,
  setTransactionFormPrefs,
  useAppStore,
} from '@/lib/store/store';

export type UseTransactionFormProps = {
  initialValues?: TransactionFormInitialValues;
  /** `addAnother`: the form already reset itself for the next entry. */
  onSaved?: (transactionId: string, addAnother: boolean) => void;
  /** Opening-balance row: signed amount; only amount, currency, date and text fields are editable. */
  isAdjustment?: boolean;
};

type SubmitMeta = { addAnother: boolean };

const FIELD_ORDER = ['amount', 'category_id', 'account_id', 'to_account_id', 'date', 'baseAmount', 'merchant_name', 'note', 'location'] as const;

function useSavedSnackbar() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const deleteTransaction = useDeleteTransaction();

  return (id: string, values: TransactionFormValues) => {
    const { numberFormat, currencyFormat } = useAppStore.getState();
    const toAccount = accounts.find((a) => a.id === values.to_account_id);
    const label = values.type === 'transfer'
      ? toAccount && translate('transactions.transfer_to', { account: toAccount.name })
      : values.merchant_name?.trim() || categories.find((c) => c.id === values.category_id)?.name;
    showSnackbar(savedSnackbar({
      type: values.type,
      amount: values.amount,
      currency: values.currency,
      format: { numberFormat, currencyFormat },
      label,
      onUndo: () => deleteTransaction.mutate(id),
      onView: () => router.push(`/transactions/${id}`),
    }));
  };
}

export function useTransactionForm({ initialValues, onSaved, isAdjustment = false }: UseTransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const id = initialValues?.id;
  const preferredCurrency = useAppStore.use.currency();
  const openTxOnCreate = useAppStore.use.openTxOnCreate();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const showSaved = useSavedSnackbar();
  const amountRef = React.useRef<TextInput>(null);
  const transactionFormPrefs = useAppStore(selectTransactionFormPrefs);
  // An edited row's stored baseAmount may be a manual correction; only re-derive once amount, currency or date change.
  const [baseAmountIsManual, setBaseAmountIsManual] = React.useState(!!id);
  const typeOptions = id
    ? TRANSACTION_TYPE_OPTIONS.filter((o) => (o.value === 'transfer') === (initialValues?.type === 'transfer'))
    : TRANSACTION_TYPE_OPTIONS;
  const onBaseDriversChanged = React.useCallback(() => {
    setBaseAmountIsManual(false);
  }, []);

  // Held in state so useForm's per-render update never swaps in recomputed defaults over "add another" ones.
  const [defaultValues, setDefaultValues] = React.useState(() => {
    const startValues = {
      ...transactionFormDefaultValues,
      date: todayISO(),
      type: transactionFormPrefs?.type || transactionFormDefaultValues.type,
      currency: transactionFormPrefs?.currency || transactionFormDefaultValues.currency,
      category_id: transactionFormPrefs?.category_id || '',
      account_id: transactionFormPrefs?.account_id || (accounts[0]?.id ?? ''),
      ...initialValues,
      amount: amountToString(initialValues?.amount),
      baseAmount: amountToString(initialValues?.baseAmount),
    } as TransactionFormValues;
    return id ? startValues : fitCategoryToType(startValues, categories, { type: !!initialValues?.type, category: !!initialValues?.category_id });
  });

  const form = useForm({
    defaultValues,
    validators: {
      onChange: isAdjustment ? adjustmentFormSchema : transactionFormSchema,
    },
    onSubmitMeta: { addAnother: false } as SubmitMeta,
    onSubmitInvalid: ({ formApi }) => {
      const failing = FIELD_ORDER.find((name) => formApi.getFieldMeta(name)?.errors.length);
      if (!failing) return;
      if (failing === 'amount') amountRef.current?.focus();
      const message = formApi.getFieldMeta(failing)?.errors[0]?.message;
      if (message) AccessibilityInfo.announceForAccessibility(message);
    },
    onSubmit: async ({ value, meta }) => {
      if (!value.account_id) return;
      const data = {
        ...value,
        category_id: value.type === 'transfer' ? null : value.category_id,
        amount: toNumber(value.amount) ?? 0,
        baseAmount: toNumber(value.baseAmount) ?? 0,
        date: dateToUnix(value.date),
      };
      let savedId = id ?? '';
      try {
        if (id) await updateTransaction.mutateAsync({ id, data });
        else savedId = await createTransaction.mutateAsync(data);
      }
      catch {
        return;
      }
      setTransactionFormPrefs({
        type: data.type,
        currency: data.currency,
        category_id: value.category_id,
        account_id: data.account_id,
      });
      addLastUsedCurrency(data.currency);
      if (!id) {
        if (meta.addAnother) {
          const next = nextEntryValues(value);
          setDefaultValues(next);
          form.reset(next);
          setBaseAmountIsManual(false);
          amountRef.current?.focus();
        }
        if (meta.addAnother || !openTxOnCreate) showSaved(savedId, value);
      }
      onSaved?.(savedId, meta.addAnother);
    },
  });

  return {
    form,
    amountRef,
    isEdit: !!id,
    accounts,
    isLoading: createTransaction.isPending || updateTransaction.isPending,
    baseAmountIsManual,
    onBaseDriversChanged,
    preferredCurrency,
    setBaseAmountIsManual,
    typeOptions,
  };
}

export type UseTransactionFormReturnType = ReturnType<typeof useTransactionForm>;
export type TransactionFormApi = UseTransactionFormReturnType['form'];
