import type { BudgetOverviewItem, UnbudgetedCategory } from './types';
import type { CategoryInitialValues } from '@/features/categories/category-form';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, Text } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { FormattedCurrency } from '@/components/ui/formatted-text';
import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/store/local-store';

import { useAppStore } from '@/lib/store/store';

type BudgetRowProps = {
  item: BudgetOverviewItem;
  onPress: (categoryId: string) => void;
};

function BudgetRow({ item, onPress }: BudgetRowProps) {
  const currency = useAppStore.use.currency();
  const remaining = item.effective_budget - item.spent;
  const isOver = remaining < 0;

  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-2xl bg-card p-4"
      style={getPressedStyle}
      onPress={() => onPress(item.category_id)}
    >
      <View
        className="size-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${item.category_color}33` }}
      >
        <Text className="text-lg">{item.category_icon ?? '📂'}</Text>
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{item.category_name}</Text>
            {item.rollover_amount !== 0 && (
              <View className="rounded-md bg-primary/10 px-1.5 py-0.5">
                <Text className="text-[10px] font-medium text-primary">
                  {item.rollover_amount > 0 ? '+' : ''}
                  {translate('budgets.rollover_badge', { amount: '' } as never).replace('', '')}
                </Text>
              </View>
            )}
          </View>
          <Text className={`text-xs font-medium ${isOver ? 'text-danger-500' : 'text-muted-foreground'}`}>
            {isOver
              ? `-${centsToAmount(Math.abs(remaining)).toFixed(2)}`
              : `${centsToAmount(remaining).toFixed(2)} left`}
          </Text>
        </View>
        <BudgetProgressBar
          spent={item.spent}
          budget={item.effective_budget}
          showPercentage={false}
          showValues={false}
        />
        <View className="flex-row justify-between">
          <FormattedCurrency className="text-xs text-muted-foreground" value={centsToAmount(item.spent)} currency={currency} />
          <FormattedCurrency className="text-xs text-muted-foreground" value={centsToAmount(item.effective_budget)} currency={currency} />
        </View>
      </View>
    </Pressable>
  );
}

type UnbudgetedRowProps = {
  item: UnbudgetedCategory;
};

function UnbudgetedRow({ item }: UnbudgetedRowProps) {
  const handlePress = () => {
    openSheet({
      type: 'edit-category',
      categoryId: item.category_id,
      initialValues: { id: item.category_id, name: item.category_name, icon: item.category_icon, color: item.category_color } as CategoryInitialValues,
    });
  };

  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-2xl bg-card/50 p-4 opacity-60"
      style={getPressedStyle}
      onPress={handlePress}
    >
      <View
        className="size-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${item.category_color}22` }}
      >
        <Text className="text-lg">{item.category_icon ?? '📂'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{item.category_name}</Text>
        <Text className="text-xs text-muted-foreground">{translate('budgets.set_budget')}</Text>
      </View>
    </Pressable>
  );
}

type Props = {
  items: BudgetOverviewItem[];
  unbudgeted: UnbudgetedCategory[];
};

export function BudgetCategoryList({ items, unbudgeted }: Props) {
  const router = useRouter();

  const sorted = React.useMemo(() =>
    [...items].sort((a, b) => {
      const ratioA = a.effective_budget > 0 ? a.spent / a.effective_budget : 0;
      const ratioB = b.effective_budget > 0 ? b.spent / b.effective_budget : 0;
      return ratioB - ratioA;
    }), [items]);

  if (sorted.length === 0 && unbudgeted.length === 0) {
    return (
      <View className="mx-4 items-center py-12">
        <Text className="text-base font-medium text-muted-foreground">{translate('budgets.no_budgets')}</Text>
        <Text className="mt-1 text-center text-sm text-muted-foreground">{translate('budgets.no_budgets_description')}</Text>
      </View>
    );
  }

  return (
    <View className="gap-2 px-4">
      {sorted.map((item) => (
        <BudgetRow
          key={item.category_id}
          item={item}
          onPress={(id) => router.push(`/budgets/${id}` as any)}
        />
      ))}

      {unbudgeted.length > 0 && (
        <>
          <Text className="mt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {translate('budgets.unbudgeted')}
          </Text>
          {unbudgeted.map((item) => (
            <UnbudgetedRow key={item.category_id} item={item} />
          ))}
        </>
      )}
    </View>
  );
}
