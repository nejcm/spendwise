import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as z from 'zod';
import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { ACCOUNT_COLORS } from '@/features/accounts/types';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['expense', 'income']),
  color: z.string(),
});

export function CategoryListScreen() {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      type: 'expense' as 'expense' | 'income',
      color: ACCOUNT_COLORS[0],
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      createCategory.mutate(
        { name: value.name, type: value.type, color: value.color, sort_order: categories.length },
        {
          onSuccess: () => {
            form.reset();
            setShowForm(false);
          },
        },
      );
    },
  });

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

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
        onPress: () => deleteCategory.mutate(id),
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
            <form.Field
              name="name"
              children={(field) => (
                <Input
                  label={translate('settings.category_name')}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  error={getFieldError(field)}
                />
              )}
            />

            <form.Field
              name="type"
              children={(field) => (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    onPress={() => field.handleChange('expense')}
                    className={`rounded-full px-3 py-1.5 ${field.state.value === 'expense' ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                  >
                    <Text className={`text-sm ${field.state.value === 'expense' ? 'font-semibold text-white' : ''}`}>
                      {translate('transactions.expense')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => field.handleChange('income')}
                    className={`rounded-full px-3 py-1.5 ${field.state.value === 'income' ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                  >
                    <Text className={`text-sm ${field.state.value === 'income' ? 'font-semibold text-white' : ''}`}>
                      {translate('transactions.income')}
                    </Text>
                  </Pressable>
                </View>
              )}
            />

            <form.Field
              name="color"
              children={(field) => (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {ACCOUNT_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => field.handleChange(c)}
                      className={`size-8 rounded-full ${field.state.value === c ? 'border-2 border-primary-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </View>
              )}
            />

            <form.Subscribe
              selector={(state) => [state.isSubmitting, state.values.name]}
              children={([isSubmitting, name]) => (
                <View className="mt-4 flex-row gap-3">
                  <Button
                    label={translate('common.cancel')}
                    variant="outline"
                    onPress={() => {
                      form.reset();
                      setShowForm(false);
                    }}
                    className="flex-1"
                  />
                  <Button
                    label={translate('common.save')}
                    onPress={form.handleSubmit}
                    disabled={!(name as string).trim() || (isSubmitting as boolean) || createCategory.isPending}
                    loading={(isSubmitting as boolean) || createCategory.isPending}
                    className="flex-1"
                  />
                </View>
              )}
            />
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
