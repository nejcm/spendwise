import * as React from 'react';
import { AppState, useColorScheme, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { FormattedCurrency, Text, View } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { centsToAmount } from '@/features/formatting/helpers';
import { useTrendByRange } from '@/features/insights/api';
import { scaleGlobalBudget } from '@/features/stats/helpers';
import { useGlobalBudget } from '@/features/stats/hooks';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { expenseColor } from '@/lib/theme/colors';
import { buildSpendingPaceModel, getSpendingPaceMonthRange } from './spending-pace';

function useCurrentDate() {
  const [today, setToday] = React.useState(() => new Date());

  React.useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;

    const scheduleMidnightUpdate = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      midnightTimer = setTimeout(() => {
        setToday(new Date());
        scheduleMidnightUpdate();
      }, nextMidnight.getTime() - now.getTime() + 100);
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(new Date());
    });
    scheduleMidnightUpdate();

    return () => {
      clearTimeout(midnightTimer);
      subscription.remove();
    };
  }, []);

  return today;
}

function SpendingPaceMessage({ description }: { description: string }) {
  return (
    <View className="rounded-2xl bg-card p-4">
      <Text className="font-medium text-foreground">{translate('home.spending_pace')}</Text>
      <Text className="mt-1 text-sm text-muted-foreground">{description}</Text>
    </View>
  );
}

export function SpendingPaceCard() {
  const today = useCurrentDate();
  const [startDate, endDate] = getSpendingPaceMonthRange(today);
  const { data: budget, isLoading: isBudgetLoading } = useGlobalBudget();
  const { data: trend, isLoading: isTrendLoading } = useTrendByRange(startDate, endDate);
  const currency = useAppStore.use.currency();
  const density = useAppStore.use.density();
  const colorScheme = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();

  if (isBudgetLoading || isTrendLoading) {
    return (
      <View testID="spending-pace-loading">
        <Skeleton height={density === 'compact' ? 190 : 220} />
      </View>
    );
  }

  if (!budget?.amountCents) {
    return <SpendingPaceMessage description={translate('home.spending_pace_no_budget')} />;
  }

  const monthlyBudget = scaleGlobalBudget(budget, {
    mode: 'month',
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const model = buildSpendingPaceModel(trend ?? [], monthlyBudget, today);

  if (model.spent === 0) {
    return <SpendingPaceMessage description={translate('home.spending_pace_empty')} />;
  }

  const chartWidth = Math.max(screenWidth - 96, 220);
  const spacing = chartWidth / Math.max(model.budget.length - 1, 1);
  const labelColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';
  const paceColor = colorScheme === 'dark' ? '#71717a' : '#a1a1aa';
  const statusKey = model.status === 'over'
    ? 'home.spending_pace_over'
    : model.status === 'below'
      ? 'home.spending_pace_below'
      : 'home.spending_pace_on';

  return (
    <View className={`overflow-hidden rounded-2xl bg-card p-4 ${density === 'compact' ? 'gap-3' : 'gap-4'}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-medium text-foreground">{translate('home.spending_pace')}</Text>
          <View className="mt-1 flex-row items-baseline gap-1">
            {model.status !== 'on' && (
              <FormattedCurrency
                value={Math.abs(model.variance)}
                currency={currency}
                fractionDigits={0}
                className={model.status === 'over' ? 'text-sm font-medium text-danger-500' : 'text-sm font-medium text-success-600'}
              />
            )}
            <Text className={`text-sm ${model.status === 'over' ? 'text-danger-500' : 'text-muted-foreground'}`}>
              {translate(statusKey)}
            </Text>
          </View>
        </View>
        <FormattedCurrency value={model.spent} currency={currency} fractionDigits={0} className="font-medium text-foreground" />
      </View>

      <View className="flex-row justify-end gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-full" style={{ backgroundColor: expenseColor }} />
          <Text className="text-xs text-muted-foreground">{translate('home.spending_pace_spent')}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-0.5 w-3" style={{ backgroundColor: paceColor }} />
          <Text className="text-xs text-muted-foreground">{translate('home.spending_pace_budget')}</Text>
        </View>
      </View>

      <LineChart
        data={model.budget.map((point) => ({
          value: centsToAmount(point.value),
          label: point.label,
        }))}
        data2={model.actual.map((point) => ({
          value: centsToAmount(point.value),
        }))}
        width={chartWidth}
        height={density === 'compact' ? 110 : 132}
        spacing={spacing}
        initialSpacing={0}
        endSpacing={0}
        color1={paceColor}
        color2={expenseColor}
        thickness1={2}
        thickness2={3}
        strokeDashArray1={[5, 5]}
        hideDataPoints
        hideYAxisText
        yAxisLabelWidth={0}
        yAxisThickness={0}
        xAxisThickness={0}
        xAxisLabelTextStyle={{ color: labelColor, fontSize: 10 }}
        hideRules
        disableScroll
        isAnimated
        animateTogether
      />
    </View>
  );
}
