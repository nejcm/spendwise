import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { PeriodPill } from '@/components/period-pill';
import { FocusAwareStatusBar, SegmentedControl, Text } from '@/components/ui';
import { useActivityCount } from '@/features/insights/api';
import { usePeriodRange } from '@/lib/hooks/use-current-year-month';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { BudgetTab } from './components/budget-tab';
import { CalendarTab } from './components/calendar-tab';
import { InsightsEmpty } from './components/insights-empty';
import { OverviewTab } from './components/overview-tab';
import { hasEnoughForInsights } from './helpers';

type StatsTab = 'overview' | 'calendar' | 'budget';

export function StatsScreen() {
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = usePeriodRange(selection);
  const { refreshing, onRefresh } = useRefresh();
  const [tab, setTab] = React.useState<StatsTab>('overview');
  const period = { selection, startDate, endDate };
  const { data: activityCount, isError: activityCountFailed } = useActivityCount();

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1"
        style={defaultStyles.transparentBg}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-wash to-background" />
        <View className="px-5 pt-2 pb-6">
          <View className="h-12 flex-row items-center gap-2">
            <Text accessibilityRole="header" className="flex-1 text-page-title font-bold tracking-page-title" numberOfLines={1}>
              {translate('insights.title')}
            </Text>
            <PeriodPill selection={selection} />
          </View>
          <SegmentedControl
            className="mt-4"
            value={tab}
            onChange={setTab}
            accessibilityLabel={translate('stats.view')}
            options={[
              { value: 'overview', label: translate('stats.overview') },
              { value: 'calendar', label: translate('stats.calendar') },
              { value: 'budget', label: translate('stats.budget') },
            ]}
          />
          {tab === 'overview' && (activityCount !== undefined || activityCountFailed) && (activityCount === undefined || hasEnoughForInsights(activityCount)
            ? <OverviewTab {...period} onShowBudgets={() => setTab('budget')} />
            : <InsightsEmpty {...period} count={activityCount} />)}
          {tab === 'calendar' && <CalendarTab {...period} />}
          {tab === 'budget' && <BudgetTab {...period} />}
        </View>
      </ScrollView>
    </>
  );
}
