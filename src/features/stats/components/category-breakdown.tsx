import type { CurrencyKey } from '../../currencies';

import type { CategoryType } from '../../insights/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable } from 'react-native';
import { FormattedCurrency, getPressedStyle, Text, View } from '@/components/ui';
import { ChevronRight } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
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
        <View className="gap-5" testID="category-horizontal-breakdown">
          <View className="h-12 flex-row gap-0.5 overflow-hidden rounded-lg">
            {breakdownItems.map((category) => (
              <View
                key={category.category_id}
                className="rounded-[3px]"
                style={{
                  backgroundColor: category.color,
                  flexBasis: 0,
                  flexGrow: category.total / total,
                }}
              />
            ))}
          </View>

          <View className="gap-3">
            {breakdownItems.map((category) => {
              const percentage = total > 0 ? (category.total / total) * 100 : 0;
              return (
                <Pressable
                  key={category.category_id}
                  className="gap-px"
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
                    <View className="flex-row items-center gap-2">
                      <FormattedCurrency value={category.total} currency={currency} className="text-sm font-medium text-foreground" />
                      <ChevronRight size={14} colorClassName="accent-muted-foreground" />
                    </View>
                  </View>
                  <ProgressBar value={percentage} color={category.category_color} showPercentage />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
