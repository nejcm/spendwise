import type { AccountFormData } from './types';
import * as React from 'react';
import { useState } from 'react';

import { Pressable, View } from 'react-native';
import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useAccountsWithBalance, useCreateAccount, useUpdateAccount } from './api';
import { AccountCard } from './components/account-card';
import { AccountForm } from './components/account-form';

export function AccountListScreen() {
  const currency = useAppStore.use.currency();
  const { data: accounts = [] } = useAccountsWithBalance();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleCreate = (data: AccountFormData) => {
    createAccount.mutate(data, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (data: AccountFormData) => {
    if (!editingId) {
      return;
    }
    updateAccount.mutate({ id: editingId, data }, {
      onSuccess: () => setEditingId(null),
    });
  };

  const editingAccount = editingId
    ? accounts.find((a) => a.id === editingId)
    : undefined;

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="mb-4 items-center rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
          <Text className="text-sm text-neutral-500">{translate('accounts.total_balance')}</Text>
          <Text className="mt-1 text-2xl font-bold">{formatCurrency(totalBalance, currency)}</Text>
        </View>

        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onPress={() => setEditingId(account.id)}
          />
        ))}

        {editingId && editingAccount && (
          <View className="mb-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="mb-3 text-lg font-semibold">{translate('accounts.edit')}</Text>
            <AccountForm
              initialData={{
                name: editingAccount.name,
                type: editingAccount.type as any,
                currency: editingAccount.currency,
                description: editingAccount.description ?? null,
                initial_balance: String(editingAccount.initial_balance / 100),
                icon: editingAccount.icon ?? null,
                color: editingAccount.color ?? null,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingId(null)}
              isSubmitting={updateAccount.isPending}
            />
          </View>
        )}

        {showForm && (
          <View className="mb-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="mb-3 text-lg font-semibold">{translate('accounts.add')}</Text>
            <AccountForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isSubmitting={createAccount.isPending}
            />
          </View>
        )}

        {accounts.length === 0 && !showForm && (
          <View className="items-center py-8">
            <Text className="text-neutral-500">{translate('accounts.no_accounts')}</Text>
          </View>
        )}
      </ScrollView>

      {!showForm && !editingId && (
        <Pressable
          className="absolute right-6 bottom-6 size-14 items-center justify-center rounded-full bg-primary-400 shadow-lg"
          onPress={() => setShowForm(true)}
        >
          <Text className="text-2xl font-bold text-white">+</Text>
        </Pressable>
      )}
    </View>
  );
}
