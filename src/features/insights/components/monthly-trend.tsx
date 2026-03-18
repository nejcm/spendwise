import type { MonthlyTotals } from '../types';
import { format, parseISO } from 'date-fns';
import * as React from 'react';
import { View } from 'react-native';

import { BarChart } from 'react-native-gifted-charts';
import { Text } from '@/components/ui';

import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';

type Props = {
  data: MonthlyTotals[];
};

export function MonthlyTrend({ data }: Props) {
  if (data.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-gray-500">{translate('insights.no_data')}</Text>
      </View>
    );
  }

  const barData = data.flatMap((d) => [
    {
      value: centsToAmount(d.income),
      label: format(parseISO(`${d.month}-01`), 'MMM'),
      frontColor: '#22C55E',
      spacing: 2,
    },
    {
      value: centsToAmount(d.expense),
      frontColor: '#EF4444',
      spacing: 14,
    },
  ]);

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-end gap-4">
        <View className="flex-row items-center gap-1">
          <View className="size-3 rounded-sm bg-success-500" />
          <Text className="text-xs text-gray-500">{translate('common.income')}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="size-3 rounded-sm bg-danger-500" />
          <Text className="text-xs text-gray-500">{translate('common.expense')}</Text>
        </View>
      </View>
      <BarChart
        data={barData}
        barWidth={14}
        noOfSections={4}
        yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        hideRules
        disablePress
        isAnimated
      />
    </View>
  );
}
