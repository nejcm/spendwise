import * as React from 'react';
import { ScrollView, View } from 'react-native';

import { SolidButton } from '@/components/ui';
import { useCategories } from '@/features/categories/api';
import { translate } from '@/lib/i18n';

import { defaultStyles } from '@/lib/theme/styles';

type Props = {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
};

export function TransactionFilterBar({ selectedCategoryId, onSelectCategory }: Props) {
  const { data: categories = [] } = useCategories();

  return (
    <View className="px-4 pb-2">
      <ScrollView
        style={defaultStyles.transparentBg}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View className="flex-row gap-2">
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
              className="items-center rounded-2xl"
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
