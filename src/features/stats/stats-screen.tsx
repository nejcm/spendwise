import * as React from 'react';
import { useMemo } from 'react';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, ScrollView, Text, View } from '@/components/ui';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { setPeriodSelection, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { CategoryBreakdown } from './components/category-breakdown';
import { StatsTrend } from './components/stats-trend';
import { Summary } from './components/summary';

export function StatsScreen() {
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);

  return (
    <View className="bg-background flex-1">
      <FocusAwareStatusBar />

      <PeriodSelector selection={selection} onSelect={setPeriodSelection} />

      <ScrollView className="flex-1 px-4 pt-2 pb-6" style={defaultStyles.transparentBg}>
        <Text className="pb-4 text-center text-2xl font-medium">{translate('stats.title')}</Text>
        <Summary startDate={startDate} endDate={endDate} currency={currency} />

        <StatsTrend
          key={`${selection.mode}-${startDate}`}
          period={selection.mode}
          startDate={startDate}
          endDate={endDate}
        />

        <CategoryBreakdown
          startDate={startDate}
          endDate={endDate}
          currency={currency}
          type="expense"
          limit={10}
        />

        <CategoryBreakdown
          startDate={startDate}
          endDate={endDate}
          currency={currency}
          type="income"
          limit={8}
        />
      </ScrollView>
    </View>
  );
}
