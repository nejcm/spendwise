import * as React from 'react';
import { View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';

import { useMonthlyTrend } from './api';
import { MonthlyTrend } from './components/monthly-trend';

export function InsightsScreen() {
  const { data: monthlyTrend = [] } = useMonthlyTrend(6);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        <View className="mb-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
          <Text className="mb-4 text-lg font-medium">
            {translate('insights.spending_by_category')}
          </Text>
        </View>

        <View className="mb-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
          <Text className="mb-4 text-lg font-medium">
            {translate('insights.monthly_trend')}
          </Text>
          <MonthlyTrend data={monthlyTrend} />
        </View>
      </ScrollView>
    </View>
  );
}
