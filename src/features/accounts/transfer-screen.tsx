import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { todayISO } from '@/lib/format';
import { translate } from '@/lib/i18n';

import { useAccounts, useCreateTransfer } from './api';

export function TransferScreen() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const createTransfer = useCreateTransfer();

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleTransfer = () => {
    if (!fromId || !toId || !amount) {
      return;
    }
    if (fromId === toId) {
      Alert.alert('Error', 'Cannot transfer to the same account');
      return;
    }

    createTransfer.mutate(
      { fromAccountId: fromId, toAccountId: toId, amount, date: todayISO(), note },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="mb-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {translate('accounts.from_account')}
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {accounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setFromId(a.id)}
              className={`rounded-full px-3 py-1.5 ${fromId === a.id ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
            >
              <Text className={`text-sm ${fromId === a.id ? 'font-semibold text-white' : ''}`}>
                {a.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="mb-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {translate('accounts.to_account')}
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {accounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setToId(a.id)}
              className={`rounded-full px-3 py-1.5 ${toId === a.id ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
            >
              <Text className={`text-sm ${toId === a.id ? 'font-semibold text-white' : ''}`}>
                {a.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input
          label={translate('transactions.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <View className="mt-4">
          <Input
            label={translate('transactions.note')}
            value={note}
            onChangeText={setNote}
            placeholder={translate('accounts.transfer_note')}
          />
        </View>

        <View className="mt-6 flex-row gap-3">
          <Button
            label={translate('common.cancel')}
            variant="outline"
            onPress={() => router.back()}
            className="flex-1"
          />
          <Button
            label={translate('accounts.transfer')}
            onPress={handleTransfer}
            disabled={!fromId || !toId || !amount || createTransfer.isPending}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </View>
  );
}
