import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { ScrollView, View } from 'react-native';
import DetailsSection from '@/components/details';
import { Alert, FocusAwareStatusBar, FormattedCurrency, FormattedDate, GhostButton, SolidButton, Text } from '@/components/ui';

import { OutlineButton } from '@/components/ui/outline-button';
import { useAccounts } from '@/features/accounts/api';
import { unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { useDeleteTransaction, useTransaction } from './api';
import { TransactionForm } from './components/transaction-form';

export function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: transaction, isLoading } = useTransaction(id ?? '');
  const deleteMut = useDeleteTransaction();
  const { data: accounts = [] } = useAccounts();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading || !transaction) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>{translate('common.loading')}</Text>
      </View>
    );
  }

  if (isEditing) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScrollView className="flex-1 px-4 py-10">
          <TransactionForm
            initialValues={{ ...transaction, date: unixToISODate(transaction.date) }}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </ScrollView>
      </>
    );
  }

  const isIncome = transaction.type === 'income';
  const account = accounts.find((a) => a.id === transaction.account_id);

  const handleDelete = () => {
    Alert.alert(translate('common.delete'), translate('transactions.delete_confirmation'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.delete'),
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await deleteMut.mutateAsync(id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleMakeRecurring = () => {
    if (transaction.type === 'transfer') return;
    openSheet({
      type: 'add-scheduled',
      initialValues: {
        type: transaction.type,
        currency: transaction.currency,
        amount: transaction.amount,
        category_id: transaction.category_id,
        account_id: transaction.account_id,
        note: transaction.note,
        start_date: unixToISODate(transaction.date),
      },
    });
    router.replace('/scheduled');
  };

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerStyle={{ flex: 1 }}>
        <View className="flex-1 px-4 py-10">
          <View className="items-center pb-6">
            <FormattedCurrency
              value={transaction.amount}
              currency={transaction.currency}
              prefix={isIncome ? '+' : '-'}
              className={`text-4xl font-bold ${isIncome ? 'text-success-600' : ''}`}
            />
            <FormattedCurrency
              value={transaction.baseAmount}
              currency={transaction.baseCurrency}
              prefix={isIncome ? '+' : '-'}
              className="text-lg text-muted-foreground"
            />
            <FormattedDate value={transaction.date} className="mt-2 text-muted-foreground" />
          </View>

          <DetailsSection
            className="mb-4"
            data={[
              { label: translate('transactions.category'), value: transaction ? `${transaction.category_icon} ${transaction.category_name}` : '-' },
              { label: translate('transactions.account'), value: account ? `${account.icon} ${account.name}` : '-' },
              { label: translate('transactions.type'), value: transaction.type, className: 'capitalize' },
              { label: translate('transactions.note'), value: transaction.note || '-' },
            ]}
          />
          <DetailsSection
            className="mb-8"
            data={[
              { label: translate('transactions.created_at'), value: <FormattedDate value={transaction.created_at} className="text-foreground" /> },
              { label: translate('transactions.updated_at'), value: <FormattedDate value={transaction.updated_at} className="text-foreground" /> },
            ]}
          />
          <View className="mb-6 flex-row items-center justify-center gap-2">
            {transaction.type !== 'transfer' && (
              <GhostButton
                label={translate('transactions.make_recurring')}
                onPress={handleMakeRecurring}
                className="flex-1"
                textClassName="underline"
              />
            )}
            <GhostButton label={translate('common.delete')} color="danger" onPress={handleDelete} className="flex-1" textClassName="underline" />
          </View>

          <View className="mt-auto flex-row gap-2">
            <OutlineButton color="secondary" label={translate('common.back')} onPress={() => router.back()} />
            <SolidButton className="flex-1" label={translate('common.edit')} onPress={() => setIsEditing(true)} />
          </View>
        </View>
      </ScrollView>
    </>
  );
}
