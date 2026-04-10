import type { TransactionType } from '../types';
import * as React from 'react';

import { ScrollView, View } from 'react-native';
import { SolidButton, Text } from '@/components/ui';
import { useCategories } from '@/features/categories/api';

import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';

export type TransactionFilterBarProps = {
  selectedCategoryId: string | null;
  selectedType: TransactionType | null;
  onSelectCategory: (id: string | null) => void;
  onSelectType: (type: TransactionType | null) => void;
};

export function TransactionFilterBar({ selectedCategoryId, selectedType, onSelectCategory, onSelectType }: TransactionFilterBarProps) {
  const { data: categories = [] } = useCategories();

  return (
    <View className="px-4">
      <ScrollView
        style={defaultStyles.transparentBg}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-2 py-3">
          <SolidButton
            className="items-center rounded-2xl px-3"
            color={selectedType === 'expense' ? 'primary' : 'secondary'}
            size="xs"
            label={translate('transactions.expense')}
            onPress={() => onSelectType(selectedType === 'expense' ? null : 'expense')}
          />
          <SolidButton
            className="items-center rounded-2xl px-3"
            color={selectedType === 'income' ? 'primary' : 'secondary'}
            size="xs"
            label={translate('transactions.income')}
            onPress={() => onSelectType(selectedType === 'income' ? null : 'income')}
          />
          <Text className="text-muted-foreground"> | </Text>
          <SolidButton
            className="items-center rounded-2xl px-4"
            color={!selectedCategoryId ? 'primary' : 'secondary'}
            size="xs"
            label={translate('transactions.all')}
            onPress={() => onSelectCategory(null)}
          />
          {categories.map((cat) => (
            <SolidButton
              key={cat.id}
              className="items-center rounded-2xl px-3"
              color={selectedCategoryId === cat.id ? 'primary' : 'secondary'}
              size="xs"
              label={cat.name}
              onPress={() => onSelectCategory(selectedCategoryId === cat.id ? null : cat.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
