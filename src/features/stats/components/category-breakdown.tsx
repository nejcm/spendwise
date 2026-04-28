import type { CurrencyKey } from '../../currencies';

import type { CategoryType } from '../../insights/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { FormattedCurrency, getPressedStyle, SolidButton, Text, View } from '@/components/ui';
import { ChevronRight } from '@/components/ui/icon';
import { centsToAmount } from '@/features/formatting/helpers';
import { useCategorySpendByRange } from '@/features/insights/api';
import { translate } from '@/lib/i18n';
import { chartColors } from '../../../lib/theme/colors';
import { useThemeConfig } from '../../../lib/theme/use-theme-config';

export type CategoryBreakdownProps = {
  startDate: number | undefined;
  endDate: number | undefined;
  currency: CurrencyKey;
  type: CategoryType;
  limit?: number;
};

export function CategoryBreakdown({
  startDate,
  endDate,
  currency,
  type,
  limit = 5,
}: CategoryBreakdownProps) {
  const router = useRouter();
  const themeConfig = useThemeConfig();
  const labelColor = themeConfig.dark ? '#9ca3af' : '#6b7280';
  const { data: categories, isLoading } = useCategorySpendByRange(startDate, endDate);
  const [viewMode, setViewMode] = React.useState<'list' | 'chart'>('list');

  const filtered = React.useMemo(() => {
    return (categories ?? [])
      .filter((c) => c.category_type === type && c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }, [categories, type, limit]);

  const maxTotal = filtered[0]?.total ?? 1;
  const title = type === 'expense' ? translate('stats.top_expenses') : translate('stats.top_income');
  const chartData = React.useMemo(() => {
    let i = 0;
    return filtered.map((category) => ({
      value: centsToAmount(category.total),
      color: category.category_color ?? chartColors[i++ % chartColors.length],
    }));
  }, [filtered]);

  if (isLoading && !categories) return null;

  if (filtered.length === 0) {
    return (
      <View className="mb-6">
        <Text className="mb-2 font-medium text-foreground">
          {title}
        </Text>
        <View className="rounded-xl bg-card p-4">
          <Text className="text-sm text-muted-foreground">{translate('stats.no_category_data')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <Text className="mb-2 font-medium text-foreground">
        {title}
      </Text>
      <View className="rounded-xl bg-card p-4">
        <View className="mb-4 flex-row rounded-lg bg-muted p-1">
          <SolidButton
            size="2xs"
            className="flex-1"
            textClassName="text-sm/snug"
            color={viewMode === 'list' ? 'default' : 'secondary'}
            onPress={() => setViewMode('list')}
            label={translate('stats.breakdown_view_list')}
          />
          <SolidButton
            size="2xs"
            className="flex-1"
            textClassName="text-sm/snug"
            color={viewMode === 'chart' ? 'default' : 'secondary'}
            onPress={() => setViewMode('chart')}
            label={translate('stats.breakdown_view_chart')}
          />
        </View>

        {viewMode === 'list'
          ? (
              <View className="gap-3">
                {filtered.map((category) => {
                  const itemBarWidth = maxTotal > 0 ? (category.total / maxTotal) * 100 : 0;
                  return (
                    <Pressable
                      key={category.category_id}
                      className="gap-1"
                      style={getPressedStyle}
                      onPress={() => router.push(`/transactions?categoryId=${category.category_id}`)}
                      accessibilityRole="button"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-lg">{category.category_icon}</Text>
                          <Text className="text-sm text-foreground" numberOfLines={1}>
                            {category.category_name}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <FormattedCurrency value={category.total} currency={currency} className="text-sm font-medium text-foreground" />
                          <ChevronRight size={14} colorClassName="accent-muted-foreground" />
                        </View>
                      </View>
                      <View className="h-1.5 rounded-full bg-muted">
                        <View
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${itemBarWidth}%`,
                            backgroundColor: category.category_color,
                          }}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )
          : (
              <View className="items-center gap-4">
                <PieChart
                  data={chartData}
                  donut
                  innerCircleColor={themeConfig.colors.card}
                  showText
                  textColor={labelColor}
                  textSize={10}
                  radius={80}
                  innerRadius={42}
                />
                <View className="w-full gap-2">
                  {filtered.map((category) => (
                    <View key={category.category_id} className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="size-2.5 rounded-full" style={{ backgroundColor: category.category_color }} />
                        <Text className="text-xs text-foreground" numberOfLines={1}>
                          {category.category_name}
                        </Text>
                      </View>
                      <FormattedCurrency value={category.total} currency={currency} className="text-xs text-muted-foreground" />
                    </View>
                  ))}
                </View>
              </View>
            )}
      </View>
    </View>
  );
}
