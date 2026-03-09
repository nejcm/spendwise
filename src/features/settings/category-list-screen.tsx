import { useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';

import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';

import { ACCOUNT_COLORS } from '@/features/accounts/types';
import { useCategories } from '@/features/transactions/api';

import { translate } from '@/lib/i18n';

import { generateId } from '@/lib/sqlite';

export function CategoryListScreen() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }
    const id = generateId();
    await db.runAsync(
      'INSERT INTO categories (id, name, color, type, is_default, sort_order) VALUES (?, ?, ?, ?, 0, ?)',
      [id, name.trim(), color, type, categories.length],
    );
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setName('');
    setShowForm(false);
  };

  const handleDelete = (id: string, catName: string, isDefault: number) => {
    if (isDefault) {
      Alert.alert('Info', 'Default categories cannot be deleted');
      return;
    }
    Alert.alert(translate('common.delete'), `Delete "${catName}"?`, [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
      },
    ]);
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="mb-3 text-lg font-semibold">{translate('settings.expense_categories')}</Text>
        {expenseCategories.map((cat) => (
          <CategoryRow
            key={cat.id}
            name={cat.name}
            color={cat.color}
            isDefault={!!cat.is_default}
            onDelete={() => handleDelete(cat.id, cat.name, cat.is_default)}
          />
        ))}

        <Text className="mt-6 mb-3 text-lg font-semibold">{translate('settings.income_categories')}</Text>
        {incomeCategories.map((cat) => (
          <CategoryRow
            key={cat.id}
            name={cat.name}
            color={cat.color}
            isDefault={!!cat.is_default}
            onDelete={() => handleDelete(cat.id, cat.name, cat.is_default)}
          />
        ))}

        {showForm && (
          <View className="mt-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
            <Input label={translate('settings.category_name')} value={name} onChangeText={setName} />
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => setType('expense')}
                className={`rounded-full px-3 py-1.5 ${type === 'expense' ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
              >
                <Text className={`text-sm ${type === 'expense' ? 'font-semibold text-white' : ''}`}>
                  {translate('transactions.expense')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType('income')}
                className={`rounded-full px-3 py-1.5 ${type === 'income' ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
              >
                <Text className={`text-sm ${type === 'income' ? 'font-semibold text-white' : ''}`}>
                  {translate('transactions.income')}
                </Text>
              </Pressable>
            </View>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {ACCOUNT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  className={`size-8 rounded-full ${color === c ? 'border-2 border-primary-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </View>
            <View className="mt-4 flex-row gap-3">
              <Button label={translate('common.cancel')} variant="outline" onPress={() => setShowForm(false)} className="flex-1" />
              <Button label={translate('common.save')} onPress={handleCreate} disabled={!name.trim()} className="flex-1" />
            </View>
          </View>
        )}
      </ScrollView>

      {!showForm && (
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

type CategoryRowProps = {
  name: string;
  color: string;
  isDefault: boolean;
  onDelete: () => void;
};

function CategoryRow({ name, color, isDefault, onDelete }: CategoryRowProps) {
  return (
    <Pressable onPress={onDelete} className="mb-1 flex-row items-center rounded-lg px-3 py-2.5">
      <View className="size-4 rounded-full" style={{ backgroundColor: color }} />
      <Text className="ml-3 flex-1 text-sm">{name}</Text>
      {isDefault && (
        <Text className="text-xs text-neutral-400">{translate('settings.default')}</Text>
      )}
    </Pressable>
  );
}
