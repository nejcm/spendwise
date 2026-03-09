import type { Category } from '../types';
import * as React from 'react';

import { View } from 'react-native';
import { Button, FocusAwareStatusBar, Input } from '@/components/ui';

import { translate } from '@/lib/i18n';
import { CategoryPicker } from './category-picker';

type Props = {
  amount: string;
  onAmountChange: (v: string) => void;
  categoryId: string | null;
  onCategorySelect: (cat: Category) => void;
  categories: Category[];
  payee: string;
  onPayeeChange: (v: string) => void;
  note: string;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
};

export function TransactionEditForm({
  amount,
  onAmountChange,
  categoryId,
  onCategorySelect,
  categories,
  payee,
  onPayeeChange,
  note,
  onNoteChange,
  onSave,
  onCancel,
  isSaving,
}: Props) {
  return (
    <View className="flex-1 px-4 pt-4">
      <FocusAwareStatusBar />

      <Input
        label={translate('transactions.amount')}
        value={amount}
        onChangeText={onAmountChange}
        keyboardType="decimal-pad"
      />

      <CategoryPicker
        categories={categories}
        selectedId={categoryId}
        onSelect={onCategorySelect}
        label={translate('transactions.category')}
      />

      <Input label={translate('transactions.payee')} value={payee} onChangeText={onPayeeChange} />

      <Input label={translate('transactions.note')} value={note} onChangeText={onNoteChange} />

      <View className="mt-4 gap-2">
        <Button label={translate('common.save')} onPress={onSave} loading={isSaving} />
        <Button label={translate('common.cancel')} variant="outline" onPress={onCancel} />
      </View>
    </View>
  );
}
