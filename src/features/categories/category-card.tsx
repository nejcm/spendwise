import type { CurrencyKey } from '../currencies';
import type { CategorySpend } from '@/features/insights/types';
import type { PeriodSelection } from '@/lib/store/store';
import * as React from 'react';
import { Pressable } from 'react-native';

import { DEFAULT_COLOR } from '@/components/color-selector';
import { FormattedCurrency, Text, View } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { TrashIcon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { scaleBudgetForPeriod } from '@/lib/date/helpers';
import { hexWithOpacity } from '@/lib/theme/colors';

export type CategoryCardProps = {
  item: CategorySpend;
  currency: CurrencyKey;
  periodSelection: PeriodSelection;
  onPress: (category: CategorySpend) => void;
  onDeletePress?: (categoryId: string, name: string) => void;
};

export default function CategoryCard({ item, currency, periodSelection, onPress, onDeletePress }: CategoryCardProps) {
  const emoji = item.category_icon && item.category_icon.trim() ? item.category_icon : item.category_name.charAt(0).toUpperCase();
  const showBudget = item.category_budget != null && item.category_budget > 0;
  const monthlyBudget = item.category_budget ?? 0;
  const scaledBudget = showBudget ? scaleBudgetForPeriod(monthlyBudget, periodSelection) : 0;
  const isMonthView = periodSelection.mode === 'month';

  return (
    <View className="min-h-[66] flex-1 justify-center rounded-xl bg-card">
      {onDeletePress && (
        <IconButton
          size="sm"
          color="none"
          className="absolute top-1 right-1 z-10 bg-background/70"
          hitSlop={10}
          onPress={() => onDeletePress(item.category_id, item.category_name)}
        >
          <TrashIcon colorClassName="accent-muted-foreground" size={15} />
        </IconButton>
      )}
      <Pressable onPress={() => onPress(item)} className="flex-1 flex-row items-center gap-2 px-2 py-1">
        <View
          className="size-9 items-center justify-center rounded-lg 3xs:size-10 2xs:size-12"
          style={{ backgroundColor: hexWithOpacity(item.category_color ?? DEFAULT_COLOR, 30) }}
        >
          <Text className="text-2xl">{emoji}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {item.category_name}
          </Text>
          {item.total !== undefined && (
            <FormattedCurrency
              value={item.total}
              currency={currency}
              className={`font-medium ${item.total > 100_000_000 ? 'text-sm 2xs:text-base' : ''}`}
              numberOfLines={1}
            />
          )}
          {showBudget && periodSelection.mode !== 'all' && (
            <BudgetProgressBar
              spent={item.expense_total}
              budget={scaledBudget ?? 0}
              monthlyBudget={!isMonthView ? monthlyBudget : undefined}
              currency={currency}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}
