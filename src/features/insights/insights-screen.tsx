import { format } from 'date-fns';
import * as React from 'react';
import { useMemo } from 'react';
import { View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

import { useCategorySpend, useMonthlyTrend } from './api';
import { MonthlyTrend } from './components/monthly-trend';
import { SpendingByCategory } from './components/spending-by-category';

export function InsightsScreen() {
  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const { data: categorySpend = [] } = useCategorySpend(currentMonth);
  const { data: monthlyTrend = [] } = useMonthlyTrend(6);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="mb-6 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <Text className="mb-4 text-lg font-semibold">
            {translate('insights.spending_by_category')}
          </Text>
          <SpendingByCategory data={categorySpend} />
        </View>

        <View className="mb-6 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <Text className="mb-4 text-lg font-semibold">
            {translate('insights.monthly_trend')}
          </Text>
          <MonthlyTrend data={monthlyTrend} />
        </View>
      </ScrollView>
    </View>
  );
}
