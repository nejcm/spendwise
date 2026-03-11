import type { CategorySpend } from '../types';
import * as React from 'react';
import { View } from 'react-native';

import { PieChart } from 'react-native-gifted-charts';
import { Text } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/lib/store';

type Props = {
  data: CategorySpend[];
};

export function SpendingByCategory({ data }: Props) {
  const currency = useAppStore.use.currency();

  if (data.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-neutral-500">No expense data</Text>
      </View>
    );
  }

  const pieData = data.slice(0, 8).map((d) => ({
    value: d.total,
    color: d.category_color,
    text: `${Math.round(d.percentage)}%`,
  }));

  const totalSpend = data.reduce((s, d) => s + d.total, 0);

  return (
    <View>
      <View className="items-center">
        <PieChart
          data={pieData}
          donut
          radius={90}
          innerRadius={60}
          centerLabelComponent={() => (
            <View className="items-center">
              <Text className="text-xs text-neutral-500">Total</Text>
              <Text className="text-sm font-bold">{formatCurrency(totalSpend, currency)}</Text>
            </View>
          )}
        />
      </View>

      <View className="mt-4 gap-2">
        {data.slice(0, 8).map((item) => (
          <View key={item.category_id} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="size-3 rounded-full" style={{ backgroundColor: item.category_color }} />
              <Text className="text-sm">{item.category_name}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-neutral-500">
                {Math.round(item.percentage)}
                %
              </Text>
              <Text className="text-sm font-medium">{formatCurrency(item.total, currency)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
