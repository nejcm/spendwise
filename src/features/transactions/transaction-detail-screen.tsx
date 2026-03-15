import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { View } from 'react-native';
import { cn } from 'tailwind-variants';
import { FocusAwareStatusBar, SolidButton, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { OutlineButton } from '@/components/ui/outline-button';
import { formatCurrency, formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
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
          {formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <Text className="mt-1 text-gray-500">{formatDate(transaction.date)}</Text>
      </View>

      <View className="mb-4 gap-4 rounded-xl bg-card p-4">
        <DetailRow label={translate('transactions.category')} value={transaction ? `${transaction.category_icon} ${transaction.category_name}` : '-'} />
        <DetailRow label={translate('transactions.account')} value={account ? `${account.icon} ${account.name}` : '-'} />
        <DetailRow label={translate('transactions.type')} value={transaction.type} className="capitalize" />
        <DetailRow label={translate('transactions.note')} value={transaction.note || '-'} />
      </View>
      <View className="mb-8 gap-4 rounded-xl bg-card p-4">
        <DetailRow label="Created at" value={formatDate(transaction.created_at)} />
        <DetailRow label="Updated at" value={formatDate(transaction.updated_at)} />
      </View>

      <View className="flex-row gap-2">
        <OutlineButton label={translate('common.delete')} color="danger" onPress={handleDelete} />
        <SolidButton className="flex-1" label={translate('common.edit')} onPress={() => setIsEditing(true)} />
      </View>
    </View>
  );
}

function DetailRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <View className="flex-row justify-between gap-2">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className={cn('text-foreground', className)}>{value}</Text>
    </View>
  );
}
