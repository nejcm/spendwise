import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';

import { useCategories } from '../api';

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
          <Pressable
            onPress={() => onSelectCategory(null)}
            className={`rounded-full px-3 py-1 ${!selectedCategoryId ? 'bg-foreground' : 'bg-muted'}`}
          >
            <Text className={`text-xs ${!selectedCategoryId ? 'font-medium text-background' : ''}`}>
              {translate('transactions.all')}
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => onSelectCategory(selectedCategoryId === cat.id ? null : cat.id)}
              className={`rounded-full px-3 py-1 ${selectedCategoryId === cat.id ? 'bg-foreground' : 'bg-muted'}`}
            >
              <Text className={`text-xs ${selectedCategoryId === cat.id ? 'font-medium text-background' : ''}`}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
