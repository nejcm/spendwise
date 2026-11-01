import * as React from 'react';
import { useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, ScrollView, SegmentedControl, View } from '@/components/ui';
import { getPeriodRange } from '@/lib/date/helpers';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { BudgetTab } from './components/budget-tab';
import { CategoryBreakdown } from './components/category-breakdown';
import { StatsCalendar } from './components/stats-calendar';
import { StatsTrend } from './components/stats-trend';
import { Summary } from './components/summary';

type StatsTab = 'overview' | 'calendar' | 'budget';

export function StatsScreen() {
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);
  const { refreshing, onRefresh } = useRefresh();
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');
  const tabOptions = [
    { value: 'overview', label: translate('stats.overview') },
    { value: 'calendar', label: translate('stats.calendar') },
    { value: 'budget', label: translate('stats.budget') },
  ] as const;

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <SegmentedControl options={tabOptions} value={activeTab} onChange={setActiveTab} className="mx-4 mt-2 mb-1" />

      {activeTab === 'calendar'
        ? (
            <StatsCalendar />
          )
        : (
            <>
              {activeTab === 'overview' && (
                <>
                  <PeriodSelector selection={selection} />
                  <ScrollView className="flex-1" style={defaultStyles.transparentBg} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    <View className="px-4 pt-4 pb-6">
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
                    </View>
                  </ScrollView>
                </>
              )}

              {activeTab === 'budget' && (
                <BudgetTab currency={currency} />
              )}
            </>
          )}
    </View>
  );
}
