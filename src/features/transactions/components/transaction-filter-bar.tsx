import type { FilterState } from '../types';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { IconButton, SolidButton, useModalSheet } from '@/components/ui';
import { SlidersHorizontal } from '@/components/ui/icon';
import { useCategories } from '@/features/categories/api';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { TransactionFilterSheet } from './transaction-filter-sheet';

export type TransactionFilterBarProps = {
  filters: FilterState;
  hasActiveFilters: boolean;
  updateFilters: (newFilters: Partial<FilterState>) => void;
};

export function TransactionFilterBar({ filters, hasActiveFilters, updateFilters }: TransactionFilterBarProps) {
  const filterSheet = useModalSheet();
  const { data: categories = [] } = useCategories();

  return (
    <>
      <View className="flex-row items-center gap-2 px-4">
        <ScrollView
          style={defaultStyles.transparentBg}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
        >
          <View className="flex-row items-center gap-1 py-3">
            <SolidButton
              className="items-center rounded-2xl px-4"
              color={!filters.categoryId ? 'primary' : 'secondary'}
              size="xs"
              label={translate('transactions.all')}
              onPress={() => updateFilters({ categoryId: null })}
            />
            {categories.map((cat) => (
              <SolidButton
                key={cat.id}
                className="items-center rounded-2xl px-3"
                color={filters.categoryId === cat.id ? 'primary' : 'secondary'}
                size="xs"
                label={cat.name}
                onPress={() => updateFilters({ categoryId: filters.categoryId === cat.id ? null : cat.id })}
              />
            ))}
          </View>
        </ScrollView>

        <IconButton
          onPress={filterSheet.present}
          hitSlop={8}
          className="relative py-3"
          accessibilityLabel={translate('common.filters')}
          accessibilityRole="button"
          size="sm"
        >
          <SlidersHorizontal size={20} colorClassName="accent-background" />
          {hasActiveFilters && (
            <View className="absolute top-0.5 right-0.5 size-2 rounded-full bg-red-600" />
          )}
        </IconButton>
      </View>
      <TransactionFilterSheet
        ref={filterSheet.ref}
        selectedType={filters.type}
        selectedAccountId={filters.accountId}
        onSelectType={(type) => updateFilters({ type })}
        onSelectAccount={(id) => updateFilters({ accountId: id })}
        onClearAll={() => {
          updateFilters({ type: null, accountId: null, categoryId: null });
        }}
        onClose={filterSheet.dismiss}
      />
    </>
  );
}
