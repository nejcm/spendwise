import type { MonthBudgetResult } from '../hooks';
import type { BudgetPeriodSelection, BudgetViewMode } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import { ScrollView, SolidButton, View } from '@/components/ui';
import { SkeletonBox } from '@/components/ui/skeleton';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { BudgetMonthCardList } from './budget-month-card';
import { BudgetMonthChart } from './budget-month-chart';
import { BudgetSummary } from './budget-summary';
import { GlobalBudgetCard } from './global-budget-card';

type BudgetRangeViewProps = {
  months: MonthBudgetResult[];
  totalBudget: number;
  totalSpent: number;
  currency: CurrencyKey;
  isLoading: boolean;
  viewMode: BudgetViewMode;
  onViewModeChange: (v: BudgetViewMode) => void;
  selection: BudgetPeriodSelection;
};

const viewModes = ['cards', 'chart'] as const;
const translations = {
  cards: translate('stats.budget_view_cards'),
  chart: translate('stats.budget_view_chart'),
};

export function BudgetRangeView({ months, totalBudget, totalSpent, currency, isLoading, viewMode, onViewModeChange, selection }: BudgetRangeViewProps) {
  if (isLoading) {
    return <SkeletonBox height={200} className="mx-4 mt-4" />;
  }
  return (
    <View className="flex-1">
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
          <View className="mb-4 flex-row rounded-xl bg-muted p-1">
            {viewModes.map((mode) => (
              <SolidButton
                key={mode}
                size="2xs"
                className="flex-1"
                textClassName="text-sm/snug"
                color={viewMode === mode ? 'default' : 'secondary'}
                onPress={() => onViewModeChange(mode)}
                label={translations[mode]}
              />
            ))}
          </View>
          {viewMode === 'cards'
            ? <BudgetMonthCardList months={months} currency={currency} />
            : <BudgetMonthChart months={months} currency={currency} />}
        </View>
      </ScrollView>
    </View>
  );
}
