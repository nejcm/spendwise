import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useCSSVariable } from 'uniwind';
import { FormattedCurrency, getPressedStyle, Text, View } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategorySpendByRange } from '@/features/insights/api';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { getCategorySpendingChartData } from './category-spending-chart';

export function CategorySpendingChartCard() {
  const router = useRouter();
  const currentMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [startDate, endDate] = React.useMemo(() => getCurrentMonthRange(currentMonth), [currentMonth]);
  const { data, isLoading } = useCategorySpendByRange(startDate, endDate);
  const density = useAppStore.use.density();
  const currency = useAppStore.use.currency();
  const cardColor = String(useCSSVariable('--color-card') ?? '#efefef');
  const chartData = React.useMemo(() => getCategorySpendingChartData(data ?? []), [data]);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const radius = density === 'compact' ? 58 : 66;

  if (isLoading && !data) {
    return (
      <View testID="category-spending-chart-loading">
        <Skeleton height={density === 'compact' ? 145 : 160} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate('home.category_spending')}
      style={getPressedStyle}
      onPress={() => router.push('/stats')}
    >
      <View className={`overflow-hidden rounded-2xl bg-card p-4 ${density === 'compact' ? 'gap-3' : 'gap-4'}`}>
        <Text className="font-medium text-foreground">{translate('home.category_spending')}</Text>

        {chartData.length > 0
          ? (
              <View className="flex-row items-center gap-5" testID="category-spending-chart-container">
                <PieChart
                  data={chartData}
                  donut
                  radius={radius}
                  innerRadius={radius * 0.62}
                  innerCircleColor={cardColor}
                  backgroundColor="transparent"
                  strokeColor={cardColor}
                  strokeWidth={2}
                  isAnimated
                  centerLabelComponent={() => (
                    <FormattedCurrency
                      value={total}
                      currency={currency}
                      shorten
                      fractionDigits={1}
                      className="text-xs font-medium text-foreground"
                    />
                  )}
                />
                <View className="min-w-0 flex-1 gap-2">
                  {chartData.map((item) => (
                    <View key={item.key} className="flex-row items-center gap-2">
                      <View className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <Text className="min-w-0 flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                        {item.label}
                      </Text>
                      <FormattedCurrency
                        value={item.value}
                        currency={currency}
                        shorten
                        fractionDigits={1}
                        className="text-xs font-medium text-foreground"
                      />
                    </View>
                  ))}
                </View>
              </View>
            )
          : (
              <View className="items-center py-8">
                <Text className="text-sm text-muted-foreground">{translate('home.category_spending_empty')}</Text>
              </View>
            )}
      </View>
    </Pressable>
  );
}
