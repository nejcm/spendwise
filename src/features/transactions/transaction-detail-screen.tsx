import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { View } from 'react-native';
import { FocusAwareStatusBar, SolidButton, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { OutlineButton } from '@/components/ui/outline-button';
import { formatCurrency, formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useAccounts, useDeleteTransaction, useTransaction } from './api';
import { TransactionForm } from './components/transaction-form';

export function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currency = useAppStore.use.currency();

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
      <TransactionForm
        initialValues={transaction}
        onSuccess={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const isIncome = transaction.type === 'income';
  const accountName = accounts.find((a) => a.id === transaction.account_id)?.name || '-';

  const handleDelete = () => {
    Alert.alert(translate('common.delete'), 'Delete this transaction?', [
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
          {formatCurrency(transaction.amount, currency)}
        </Text>
        <Text className="mt-1 text-gray-500">{formatDate(transaction.date)}</Text>
      </View>

      <View className="gap-4 rounded-xl bg-card p-4">
        <DetailRow label={translate('transactions.category')} value={transaction.category_name || '-'} />
        <DetailRow label={translate('transactions.note')} value={transaction.note || '-'} />
        <DetailRow label={translate('transactions.account')} value={accountName} />
      </View>

      <View className="mt-6 flex-row gap-2">
        <OutlineButton label={translate('common.delete')} color="danger" onPress={handleDelete} />
        <SolidButton className="flex-1" label={translate('common.edit')} onPress={() => setIsEditing(true)} />
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-gray-500">{label}</Text>
      <Text className="font-medium">{value}</Text>
    </View>
  );
}
