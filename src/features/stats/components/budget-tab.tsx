import type { BudgetPeriodSelection, BudgetViewMode } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { ScrollView, View } from '@/components/ui';
import { defaultStyles } from '@/lib/theme/styles';
import { defaultBudgetPeriodSelection, expandToMonthSlices } from '../helpers';
import { useBudgetStats, useBudgetStatsByRange } from '../hooks';
import { BudgetCategoryList } from './budget-category-list';
import { GlobalBudgetCard } from './global-budget-card';
import { BudgetPeriodSelector } from './budget-period-selector';
import { BudgetRangeView } from './budget-range-view';
import { BudgetSummary } from './budget-summary';

type Props = {
  currency: CurrencyKey;
};

export function BudgetTab({ currency }: Props) {
  const [selection, setSelection] = React.useState<BudgetPeriodSelection>(
    defaultBudgetPeriodSelection,
  );
  const [viewMode, setViewMode] = React.useState<BudgetViewMode>('cards');

  const isMultiMonth = selection.mode !== 'month';
  const slices = React.useMemo(() => expandToMonthSlices(selection), [selection]);

  const { data: singleData } = useBudgetStats(
    isMultiMonth ? undefined : selection,
    !isMultiMonth,
  );
  const rangeData = useBudgetStatsByRange(isMultiMonth ? slices : []);

  if (isMultiMonth) {
    return (
      <View className="flex-1">
        <BudgetPeriodSelector selection={selection} onChange={setSelection} />
        <BudgetRangeView
          months={rangeData.months}
          totalBudget={rangeData.totalBudget}
          totalSpent={rangeData.totalSpent}
          currency={currency}
          isLoading={rangeData.isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selection={selection}
        />
      </View>
    );
  }

  const categories = singleData?.categories ?? [];
  const totalBudget = singleData?.totalBudget ?? 0;
  const totalSpent = singleData?.totalSpent ?? 0;
  return (
    <View className="flex-1">
      <BudgetPeriodSelector selection={selection} onChange={setSelection} />
      <ScrollView className="flex-1" style={defaultStyles.transparentBg}>
        <View className="px-4 pt-1 pb-8">
          <GlobalBudgetCard selection={selection} currency={currency} />
          {totalBudget > 0 && (
            <BudgetSummary
              totalBudget={totalBudget}
              totalSpent={totalSpent}
              currency={currency}
            />
          )}
          <BudgetCategoryList categories={categories} currency={currency} />
        </View>
      </ScrollView>
    </View>
  );
}
