import type { TransactionFormInitialValues, TransactionFormValues } from '@/features/transactions/components/transaction-form-schema';
import { useForm } from '@tanstack/react-form';

import * as React from 'react';
import { useAccounts } from '@/features/accounts/api';
import { mergeCurrencyArrays } from '@/features/currencies/helpers';
import { CURRENCY_OPTIONS } from '@/features/currencies/images';
import { useCreateTransaction, useUpdateTransaction } from '@/features/transactions/api';
import {
  amountToString,
  transactionFormDefaultValues,
  transactionFormSchema,
} from '@/features/transactions/components/transaction-form-schema';
import { dateToUnix } from '@/lib/date/helpers';
import { toNumber } from '@/lib/number';
import {
  addLastUsedCurrency,
  selectLastUsedCurrencies,
  selectTransactionFormPrefs,
  setTransactionFormPrefs,
  useAppStore,
} from '@/lib/store/store';

export function useTransactionForm(initialValues?: TransactionFormInitialValues, onSuccess?: () => void) {
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

  return {
    form,
    accounts,
    createTransaction,
    updateTransaction,
    baseAmountIsManual,
    onBaseDriversChanged,
    orderedCurrencies,
    preferredCurrency,
    setBaseAmountIsManual,
  };
}

export type UseTransactionFormReturnType = ReturnType<typeof useTransactionForm>;
