import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { View } from 'react-native';
import DetailsSection from '@/components/details';
import { FocusAwareStatusBar, SolidButton, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { OutlineButton } from '@/components/ui/outline-button';
import { formatCurrency, formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { GhostButton } from '../../components/ui/ghost-button';
import { useAccounts, useDeleteTransaction, useTransaction } from './api';
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
      <View className="flex-1 items-center justify-center">
        <Text>{translate('common.loading')}</Text>
      </View>
    );
  }

  if (isEditing) {
    return (
      <View className="flex-1 p-4">
        <TransactionForm
          initialValues={transaction}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </View>
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

  return (
    <View className="flex-1 px-4 pt-4">
      <FocusAwareStatusBar />
      <View className="items-center py-6">
        <Text className={`text-4xl font-bold ${isIncome ? 'text-success-600' : ''}`}>
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <Text className="mt-1 text-gray-500">{formatDate(transaction.date)}</Text>
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
          { label: translate('transactions.created_at'), value: formatDate(transaction.created_at) },
          { label: translate('transactions.updated_at'), value: formatDate(transaction.updated_at) },
        ]}
      />
      <View className="mb-6 justify-center">
        <OutlineButton label={translate('common.delete')} color="danger" onPress={handleDelete} className="rounded-3xl px-6" size="sm" />
      </View>

      <View className="flex-row gap-2">
        <GhostButton color="secondary" label={translate('common.back')} onPress={() => router.back()} />
        <SolidButton className="flex-1" label={translate('common.edit')} onPress={() => setIsEditing(true)} />
      </View>
    </View>
  );
}
