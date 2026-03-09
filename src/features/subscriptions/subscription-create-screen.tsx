import type { RecurringFrequency } from './types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { Pressable, View } from 'react-native';
import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { useAccounts, useCategories } from '@/features/transactions/api';
import { CategoryPicker } from '@/features/transactions/components/category-picker';
import { todayISO } from '@/lib/format';

import { translate } from '@/lib/i18n';

import { useCreateRecurringRule } from './api';

import { FREQUENCY_LABELS } from './types';

const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

export function SubscriptionCreateScreen() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const createRule = useCreateRecurringRule();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');

  const categoryType = type === 'income' ? 'income' as const : 'expense' as const;
  const { data: categories = [] } = useCategories(categoryType);

  const handleSubmit = () => {
    if (!amount || !accountId) {
      return;
    }
    createRule.mutate(
      {
        account_id: accountId,
        category_id: categoryId,
        type,
        amount,
        note,
        payee,
        frequency,
        start_date: todayISO(),
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="mb-4 flex-row gap-2">
          <Pressable
            onPress={() => setType('expense')}
            className={`flex-1 rounded-full py-2 ${type === 'expense' ? 'bg-danger-500' : 'bg-neutral-100 dark:bg-neutral-700'}`}
          >
            <Text className={`text-center text-sm font-semibold ${type === 'expense' ? 'text-white' : ''}`}>
              {translate('transactions.expense')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setType('income')}
            className={`flex-1 rounded-full py-2 ${type === 'income' ? 'bg-success-600' : 'bg-neutral-100 dark:bg-neutral-700'}`}
          >
            <Text className={`text-center text-sm font-semibold ${type === 'income' ? 'text-white' : ''}`}>
              {translate('transactions.income')}
            </Text>
          </Pressable>
        </View>

        <Input
          label={translate('transactions.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <View className="mt-4">
          <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {translate('transactions.account')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setAccountId(a.id)}
                className={`rounded-full px-3 py-1.5 ${accountId === a.id ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
              >
                <Text className={`text-sm ${accountId === a.id ? 'font-semibold text-white' : ''}`}>
                  {a.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-4">
          <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {translate('subscriptions.frequency')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FREQUENCIES.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                className={`rounded-full px-3 py-1.5 ${frequency === f ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
              >
                <Text className={`text-sm ${frequency === f ? 'font-semibold text-white' : ''}`}>
                  {FREQUENCY_LABELS[f]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-4">
          <CategoryPicker
            categories={categories}
            selectedId={categoryId}
            onSelect={(cat) => setCategoryId(cat.id)}
            label={translate('transactions.category')}
          />
        </View>

        <View className="mt-4">
          <Input label={translate('transactions.payee')} value={payee} onChangeText={setPayee} />
        </View>
        <View className="mt-4">
          <Input label={translate('transactions.note')} value={note} onChangeText={setNote} />
        </View>

        <View className="mt-6 mb-8 flex-row gap-3">
          <Button label={translate('common.cancel')} variant="outline" onPress={() => router.back()} className="flex-1" />
          <Button
            label={translate('common.save')}
            onPress={handleSubmit}
            disabled={!amount || !accountId || createRule.isPending}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </View>
  );
}
