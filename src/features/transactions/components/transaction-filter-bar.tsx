import type { FilterState } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { I18nManager, ScrollView, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
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
  const background = String(useCSSVariable('--color-background') ?? '#fcfcfc');
  const rtl = I18nManager.isRTL;

  return (
    <>
      <View className="flex-row items-stretch px-4">
        <View className="relative flex-1">
          <ScrollView
            style={defaultStyles.transparentBg}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
          >
            <View className="flex-1">
              <View className="flex-row items-center gap-1 py-3 pr-4">
                <SolidButton
                  className="items-center rounded-2xl px-4"
                  color={!filters.categoryId ? 'default' : 'secondary'}
                  size="xs"
                  label={translate('transactions.all')}
                  onPress={() => updateFilters({ categoryId: null })}
                />
                {categories.map((cat) => (
                  <SolidButton
                    key={cat.id}
                    className="items-center rounded-2xl px-3"
                    color={filters.categoryId === cat.id ? 'default' : 'secondary'}
                    size="xs"
                    label={cat.name}
                    onPress={() => updateFilters({ categoryId: filters.categoryId === cat.id ? null : cat.id })}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', background]}
            start={{ x: rtl ? 1 : 0, y: 0 }}
            end={{ x: rtl ? 0 : 1, y: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 20,
              ...(rtl ? { left: 0 } : { right: 0 }),
            }}
          />
        </View>

        <View className="justify-center bg-background py-3 pl-2">
          <IconButton
            onPress={filterSheet.present}
            hitSlop={8}
            className="relative"
            accessibilityLabel={translate('common.filters')}
            accessibilityRole="button"
            size="sm"
          >
            <SlidersHorizontal size={20} colorClassName="accent-background" />
            {hasActiveFilters && (
              <View className="absolute top-0 right-0 size-2.5 rounded-full bg-red-600" />
            )}
          </IconButton>
        </View>
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
        onClose={filterSheet.close}
      />
    </>
  );
}
