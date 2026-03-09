import type { BudgetPeriod } from './types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { Pressable, View } from 'react-native';
import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { useCategories } from '@/features/transactions/api';

import { translate } from '@/lib/i18n';

import { useCreateBudget } from './api';

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
];

export function BudgetCreateScreen() {
  const router = useRouter();
  const { data: categories = [] } = useCategories('expense');
  const createBudget = useCreateBudget();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [lineAmounts, setLineAmounts] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    if (!name.trim() || !amount) {
      return;
    }

    const lines = Object.entries(lineAmounts)
      .filter(([_, v]) => Number.parseFloat(v) > 0)
      .map(([categoryId, amt]) => ({ category_id: categoryId, amount: amt }));

    createBudget.mutate(
      { name: name.trim(), period, amount, lines },
      { onSuccess: () => router.back() },
    );
  };

  const updateLineAmount = (categoryId: string, value: string) => {
    setLineAmounts((prev) => ({ ...prev, [categoryId]: value }));
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <Input
          label={translate('budgets.budget_name')}
          value={name}
          onChangeText={setName}
          placeholder={translate('budgets.name_placeholder')}
        />

        <View className="mt-4">
          <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {translate('budgets.period')}
          </Text>
          <View className="flex-row gap-2">
            {PERIODS.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPeriod(p.value)}
                className={`rounded-full px-3 py-1.5 ${period === p.value ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
              >
                <Text className={`text-sm ${period === p.value ? 'font-semibold text-white' : ''}`}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-4">
          <Input
            label={translate('budgets.total_amount')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        <Text className="mt-6 mb-3 text-lg font-semibold">
          {translate('budgets.category_budgets')}
        </Text>

        {categories.map((cat) => (
          <View key={cat.id} className="mb-2 flex-row items-center gap-3">
            <View className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
            <Text className="flex-1 text-sm">{cat.name}</Text>
            <Input
              className="w-24"
              value={lineAmounts[cat.id] ?? ''}
              onChangeText={(v) => updateLineAmount(cat.id, v)}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
        ))}

        <View className="mt-6 mb-8 flex-row gap-3">
          <Button
            label={translate('common.cancel')}
            variant="outline"
            onPress={() => router.back()}
            className="flex-1"
          />
          <Button
            label={translate('common.save')}
            onPress={handleSubmit}
            disabled={!name.trim() || !amount || createBudget.isPending}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </View>
  );
}
