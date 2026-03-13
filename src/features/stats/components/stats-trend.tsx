import type { MonthlyTotals } from '@/features/insights/types';
import { format, parseISO } from 'date-fns';

import * as React from 'react';
import { Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

const MAX_BAR_HEIGHT = 80;

type Props = {
  data: MonthlyTotals[];
  period: 'week' | 'month' | 'year';
  selected: number; // either a year or a month or a week
};

export function StatsTrend({ data }: Props) {
  const maxValue = React.useMemo(
    () => Math.max(...data.flatMap((d) => [d.income, d.expense]), 1),
    [data],
  );

  if (data.length === 0) return null;

  return (
    <View className="p-4">
      <View className="mb-4 flex-row gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-full bg-green-500/25" />
          <Text className="text-xs text-muted-foreground">{translate('common.income')}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-full bg-red-500/25" />
          <Text className="text-xs text-muted-foreground">{translate('common.expenses')}</Text>
        </View>
      </View>
      <View className="flex-row items-end gap-1">
        {data.map((item) => {
          const incomeHeight = Math.max((item.income / maxValue) * MAX_BAR_HEIGHT, item.income > 0 ? 2 : 0);
          const expenseHeight = Math.max((item.expense / maxValue) * MAX_BAR_HEIGHT, item.expense > 0 ? 2 : 0);
          const monthLabel = format(parseISO(`${item.month}-01`), 'MMM');
          return (
            <View key={item.month} className="flex-1 items-center gap-1">
              <View
                className="w-full flex-row items-end gap-0.5"
                style={{ height: MAX_BAR_HEIGHT }}
              >
                <View
                  className="flex-1 rounded-t-sm bg-green-500"
                  style={{ height: incomeHeight }}
                />
                <View
                  className="flex-1 rounded-t-sm bg-red-500"
                  style={{ height: expenseHeight }}
                />
              </View>
              <Text className="text-[10px] text-muted-foreground">{monthLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
