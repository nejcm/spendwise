import type { CurrencyKey } from '../../currencies';

import * as React from 'react';
import { FormattedCurrency, Text, View } from '@/components/ui';
import { useCategorySpendByRange } from '@/features/insights/api';
import { translate } from '@/lib/i18n';

export type CategoryBreakdownProps = {
  startDate: number;
  endDate: number;
  currency: CurrencyKey;
  type: 'expense' | 'income';
  limit?: number;
};

export function CategoryBreakdown({
  startDate,
  endDate,
  currency,
  type,
  limit = 5,
}: CategoryBreakdownProps) {
  const { data: categories, isLoading } = useCategorySpendByRange(startDate, endDate);

  const filtered = React.useMemo(() => {
    return (categories ?? [])
      .filter((c) => c.category_type === type && c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }, [categories, type, limit]);

  const maxTotal = filtered[0]?.total ?? 1;
  const title = type === 'expense' ? translate('stats.top_expenses') : translate('stats.top_income');

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
        <View className="gap-3">
          {filtered.map((category) => {
            const barWidth = maxTotal > 0 ? (category.total / maxTotal) * 100 : 0;
            return (
              <View key={category.category_id} className="gap-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-lg">{category.category_icon}</Text>
                    <Text className="text-sm text-foreground" numberOfLines={1}>
                      {category.category_name}
                    </Text>
                  </View>
                  <FormattedCurrency value={category.total} currency={currency} className="text-sm font-medium text-foreground" />
                </View>
                <View className="h-1.5 rounded-full bg-muted">
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: category.category_color,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
