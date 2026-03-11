import type { TransactionType } from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { Alert, View } from 'react-native';
import { Button, FocusAwareStatusBar, Text } from '@/components/ui';
import { centsToAmount, formatCurrency, formatDate } from '@/lib/format';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useAccounts, useCategories, useDeleteTransaction, useTransaction, useUpdateTransaction } from './api';
import { TransactionEditForm } from './components/transaction-edit-form';

export function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currency = useAppStore.use.currency();

  const { data: transaction, isLoading } = useTransaction(id ?? '');
  const updateMut = useUpdateTransaction();
  const deleteMut = useDeleteTransaction();
  const { data: categories = [] } = useCategories(transaction?.type as 'income' | 'expense' | undefined);
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
      <TransactionEditForm
        initialValues={{
          amount: String(centsToAmount(transaction.amount)),
          category_id: transaction.category_id,
          note: transaction.note || '',
        }}
        categories={categories}
        isSaving={updateMut.isPending}
        onCancel={() => setIsEditing(false)}
        onSave={async (data) => {
          if (!id) return;
          await updateMut.mutateAsync({
            id,
            data: {
              type: transaction.type as TransactionType,
              amount: data.amount,
              category_id: data.category_id,
              account_id: transaction.account_id,
              date: transaction.date,
              note: data.note,
            },
          });
          setIsEditing(false);
        }}
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
        <Text className="mt-1 text-neutral-500">{formatDate(transaction.date)}</Text>
      </View>

      <View className="gap-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
        <DetailRow label={translate('transactions.category')} value={transaction.category_name || '-'} />
        <DetailRow label={translate('transactions.note')} value={transaction.note || '-'} />
        <DetailRow label={translate('transactions.account')} value={accountName} />
      </View>

      <View className="mt-6 gap-2">
        <Button label={translate('common.edit')} variant="outline" onPress={() => setIsEditing(true)} />
        <Button label={translate('common.delete')} variant="destructive" onPress={handleDelete} />
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-neutral-500">{label}</Text>
      <Text className="font-medium">{value}</Text>
    </View>
  );
}
