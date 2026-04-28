import type { MonthBudgetResult } from '../hooks';
import type { CurrencyKey } from '@/features/currencies';
import { format } from 'date-fns';
import * as React from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text, View } from '@/components/ui';
import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';

const BUDGET_COLOR = '#9ca3af';
const SPENT_NORMAL = '#2ebe7e';
const SPENT_WARNING = '#f59e0b';
const SPENT_DANGER = '#e12f30';
const PAIR_GAP = 2;

function spentColor(spent: number, budget: number): string {
  if (budget === 0) return SPENT_NORMAL;
  const r = spent / budget;
  if (r >= 1) return SPENT_DANGER;
  if (r >= 0.8) return SPENT_WARNING;
  return SPENT_NORMAL;
}

type Props = {
  months: MonthBudgetResult[];
  currency: CurrencyKey;
};

export function BudgetMonthChart({ months }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  const { barData, barWidth, spacing } = React.useMemo(() => {
    const count = months.length;
    if (count === 0) return { barData: [], barWidth: 10, spacing: 16 };

    const availableWidth = screenWidth - 104;
    const targetBarWidth = count > 9 ? 8 : count > 6 ? 10 : 14;
    const labelWidth = 2 * targetBarWidth + PAIR_GAP;
    const computedSpacing = Math.max(8, Math.floor(availableWidth / count - labelWidth));
    const labelFontSize = count > 9 ? 9 : 10;

    const data = months.flatMap((m) => [
      {
        value: centsToAmount(m.totalBudget),
        label: format(new Date(m.year, m.month - 1, 1), 'MMM'),
        spacing: PAIR_GAP,
        labelWidth,
        labelTextStyle: {
          color: labelColor,
          fontSize: labelFontSize,
          textAlign: 'center' as const,
        },
        frontColor: BUDGET_COLOR,
      },
      {
        value: centsToAmount(m.totalSpent),
        frontColor: spentColor(m.totalSpent, m.totalBudget),
      },
    ]);

    return { barData: data, barWidth: targetBarWidth, spacing: computedSpacing };
  }, [months, labelColor, screenWidth]);

  if (barData.length === 0) return null;

  return (
    <View className="overflow-hidden rounded-2xl bg-card p-4">
      <View className="mb-4 flex-row items-center justify-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-full" style={{ backgroundColor: BUDGET_COLOR }} />
          <Text className="text-xs text-muted-foreground">{translate('stats.budget_legend_budget')}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-full" style={{ backgroundColor: SPENT_NORMAL }} />
          <Text className="text-xs text-muted-foreground">{translate('stats.budget_legend_spent')}</Text>
        </View>
      </View>
      <BarChart
        key={months.map((m) => `${m.year}-${m.month}`).join(',')}
        data={barData}
        barWidth={barWidth}
        spacing={spacing}
        initialSpacing={0}
        roundedTop
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
        noOfSections={3}
        isAnimated
        disablePress
      />
    </View>
  );
}
