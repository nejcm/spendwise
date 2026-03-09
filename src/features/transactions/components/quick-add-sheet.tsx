import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { TransactionType } from '../types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { useState } from 'react';

import { Pressable, View } from 'react-native';
import { Button, Input, Modal, Text } from '@/components/ui';
import { todayISO } from '@/lib/format';

import { translate } from '@/lib/i18n';
import { useAccounts, useCategories, useCreateTransaction } from '../api';
import { CategoryPicker } from './category-picker';

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
};

const TYPE_OPTIONS: { label: string; value: TransactionType }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

export function QuickAddSheet({ sheetRef }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [payee, setPayee] = useState('');
  const categoryType = type === 'transfer' ? undefined : type;
  const { data: categories = [] } = useCategories(categoryType);
  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();

  const resetForm = () => {
    setAmount('');
    setCategoryId(null);
    setNote('');
    setPayee('');
    setType('expense');
  };

  const handleSave = async () => {
    if (!amount || !accounts[0])
      return;
    await createTransaction.mutateAsync({
      type,
      amount,
      category_id: categoryId,
      account_id: accounts[0].id,
      date: todayISO(),
      note,
      payee,
    });
    resetForm();
    sheetRef.current?.dismiss();
  };

  return (
    <Modal ref={sheetRef} title={translate('transactions.add')} snapPoints={['85%']}>
      <BottomSheetScrollView className="flex-1 px-4 pb-8">
        <View className="mb-4 flex-row gap-2">
          {TYPE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              className={`flex-1 items-center rounded-xl py-2 ${
                type === option.value ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
              onPress={() => {
                setType(option.value);
                setCategoryId(null);
              }}
            >
              <Text className={`font-semibold ${type === option.value ? 'text-white' : 'dark:text-neutral-100'}`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input
          label={translate('transactions.amount')}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          testID="amount-input"
        />
        <CategoryPicker
          categories={categories}
          selectedId={categoryId}
          onSelect={(cat) => setCategoryId(cat.id)}
          label={translate('transactions.category')}
        />
        <Input
          label={translate('transactions.payee')}
          value={payee}
          onChangeText={setPayee}
          placeholder="e.g. Grocery Store"
        />
        <Input label={translate('transactions.note')} value={note} onChangeText={setNote} placeholder="Optional note" />
        <Button
          label={translate('common.save')}
          onPress={handleSave}
          loading={createTransaction.isPending}
          disabled={!amount || Number.parseFloat(amount) <= 0}
        />
      </BottomSheetScrollView>
    </Modal>
  );
}
