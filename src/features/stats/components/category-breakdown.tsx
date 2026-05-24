import type { CurrencyKey } from '../../currencies';

import type { CategoryType } from '../../insights/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable } from 'react-native';
import { FormattedCurrency, getPressedStyle, SolidButton, Text, View } from '@/components/ui';
import { ChevronRight } from '@/components/ui/icon';
import { useCategorySpendByRange } from '@/features/insights/api';
import { translate } from '@/lib/i18n';
import { chartColors } from '@/lib/theme/colors';

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
  const { data: categories, isLoading } = useCategorySpendByRange(startDate, endDate);
  const [viewMode, setViewMode] = React.useState<'list' | 'chart'>('list');

  const filtered = React.useMemo(() => {
    return (categories ?? [])
      .filter((c) => c.category_type === type && c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }, [categories, type, limit]);

  const total = filtered.reduce((acc, curr) => acc + curr.total, 0);

  const title = type === 'expense' ? translate('stats.top_expenses') : translate('stats.top_income');
  const breakdownItems = React.useMemo(() => {
    let i = 0;
    return filtered.map((category) => ({
      ...category,
      color: category.category_color || chartColors[i++ % chartColors.length],
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
              <View className="gap-4">
                {filtered.map((category) => {
                  const itemBarWidth = total > 0 ? (category.total / total) * 100 : 0;
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
              <View className="gap-5" testID="category-horizontal-breakdown">
                <View className="h-10 flex-row overflow-hidden rounded-lg bg-muted">
                  {breakdownItems.map((category, index) => (
                    <View
                      key={category.category_id}
                      className={index === 0 ? '' : 'ml-0.5'}
                      style={{
                        backgroundColor: category.color,
                        flexBasis: 0,
                        flexGrow: category.total / total,
                      }}
                    />
                  ))}
                </View>

                <View className="gap-4">
                  {breakdownItems.map((category) => {
                    const itemBarWidth = total > 0 ? (category.total / total) * 100 : 0;
                    return (
                      <Pressable
                        key={category.category_id}
                        className="gap-1"
                        style={getPressedStyle}
                        onPress={() => router.push(`/transactions?categoryId=${category.category_id}`)}
                        accessibilityRole="button"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="mr-3 flex-1 flex-row items-center gap-2">
                            <Text className="text-lg">{category.category_icon}</Text>
                            <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                              {category.category_name}
                            </Text>
                          </View>
                          <FormattedCurrency value={category.total} currency={currency} className="text-sm font-medium text-foreground" />
                        </View>
                        <View className="h-1.5 rounded-full bg-muted">
                          <View
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${itemBarWidth}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
      </View>
    </View>
  );
}
