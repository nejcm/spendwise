import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import * as z from 'zod';
import { Button, Input, Modal, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { todayISO } from '@/lib/format';
import { translate } from '@/lib/i18n';
import { useAccounts, useCategories, useCreateTransaction } from '../api';
import { CategoryPicker } from './category-picker';

const schema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.string().min(1, 'Amount is required'),
  category_id: z.string().nullable(),
  note: z.string(),
});

const TYPE_OPTIONS: { label: string; value: 'expense' | 'income' }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

export type QuickAddSheetProps = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
};

type QuickAddFormData = z.infer<typeof schema>;

const defaultValues = {
  type: 'expense' as 'expense' | 'income',
  amount: '',
  category_id: null as string | null,
  note: '',
} satisfies QuickAddFormData;

export function QuickAddSheet({ sheetRef }: QuickAddSheetProps) {
  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();
  const { data: expenseCategories = [] } = useCategories('expense');
  const { data: incomeCategories = [] } = useCategories('income');

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      account_id: accounts[0]?.id ?? '',
    },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      if (!accounts[0]) return;
      await createTransaction.mutateAsync({
        type: value.type,
        amount: value.amount,
        category_id: value.category_id,
        account_id: accounts[0].id,
        date: todayISO(),
        note: value.note,
      });
      form.reset();
      sheetRef.current?.dismiss();
    },
  });

  return (
    <Modal ref={sheetRef} title={translate('transactions.add')} snapPoints={['85%']}>
      <BottomSheetScrollView className="flex-1 px-4 pb-8">
        <form.Field
          name="type"
          children={(field) => (
            <View className="mb-4 flex-row gap-2">
              {TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  className={`flex-1 items-center rounded-xl py-2 ${
                    field.state.value === option.value ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                  onPress={() => {
                    field.handleChange(option.value);
                    form.setFieldValue('category_id', null);
                  }}
                >
                  <Text className={`font-semibold ${field.state.value === option.value ? 'text-white' : 'dark:text-neutral-100'}`}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />

        <form.Field
          name="amount"
          children={(field) => (
            <Input
              label={translate('transactions.amount')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              placeholder="0.00"
              keyboardType="decimal-pad"
              testID="amount-input"
              error={getFieldError(field)}
            />
          )}
        />

        <form.Subscribe
          selector={(state) => state.values.type}
          children={(typeValue) => (
            <form.Field
              name="category_id"
              children={(field) => (
                <CategoryPicker
                  categories={typeValue === 'expense' ? expenseCategories : incomeCategories}
                  selectedId={field.state.value}
                  onSelect={(cat) => field.handleChange(cat.id)}
                  label={translate('transactions.category')}
                />
              )}
            />
          )}
        />

        <form.Field
          name="note"
          children={(field) => (
            <Input
              label={translate('transactions.note')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              placeholder="Optional note"
              error={getFieldError(field)}
            />
          )}
        />

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values.amount]}
          children={([isSubmitting, amount]) => (
            <Button
              label={translate('common.save')}
              onPress={form.handleSubmit}
              loading={(isSubmitting as boolean) || createTransaction.isPending}
              disabled={!(amount as string) || Number.parseFloat(amount as string) <= 0}
            />
          )}
        />
      </BottomSheetScrollView>
    </Modal>
  );
}
