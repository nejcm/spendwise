import type { CategorySpend, CategoryType } from '@/features/insights/types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { DEFAULT_COLOR } from '@/components/color-selector';
import { getPressedStyle, Text } from '@/components/ui';
import { BUDGET_STATE_CLASSES, getBudgetState } from '@/components/ui/budget-state';
import { Plus } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { categoryIcon, categoryName } from '../helpers';
import { useFormatMoney } from '../hooks';
import { BudgetRing } from './budget-ring';

type CategoryTileProps = {
  item: CategorySpend;
  kind: CategoryType;
  /** Budget scaled to the selected Period; undefined hides the ring. */
  budget: number | undefined;
  onPress: () => void;
};

export function CategoryTile({ item, kind, budget, onPress }: CategoryTileProps) {
  const isIncome = kind === 'income';
  const amount = isIncome ? item.income_total : item.expense_total;
  const state = isIncome ? 'none' : getBudgetState(amount, budget);
  const format = useFormatMoney();
  const name = categoryName(item.category_id, item.category_name);
  const label = state === 'none'
    ? translate('categories.tile_label_no_budget', { name, amount: format(amount) })
    : translate('categories.tile_label', { name, amount: format(amount), budget: format(budget!) });

  const isCompact = useAppStore.use.density() === 'compact';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={getPressedStyle}
      className={cn('flex-1 flex-row items-center gap-2.5 rounded-[18px] border-[1.5px] border-transparent bg-card px-2', isCompact ? 'h-14' : 'h-16')}
    >
      <BudgetRing
        ratio={budget ? amount / budget : 0}
        state={state}
        icon={categoryIcon(item.category_id, item.category_icon, item.category_name)}
        color={item.category_color ?? DEFAULT_COLOR}
      />
      <View className="min-w-0 flex-1">
        <Text className="text-meta text-muted-foreground" numberOfLines={1}>{name}</Text>
        <Text
          className={cn('text-base font-semibold tracking-tight tabular-nums', state === 'over' && BUDGET_STATE_CLASSES.over.text)}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {format(amount)}
        </Text>
      </View>
    </Pressable>
  );
}

export function NewCategoryTile({ onPress, className }: { onPress: () => void; className?: string }) {
  const isCompact = useAppStore.use.density() === 'compact';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={getPressedStyle}
      className={cn('flex-1 flex-row items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-track px-2', isCompact ? 'h-14' : 'h-16', className)}
    >
      <Plus size={18} colorClassName="accent-muted-foreground" />
      <Text className="text-sm font-medium text-muted-foreground">{translate('categories.new')}</Text>
    </Pressable>
  );
}
