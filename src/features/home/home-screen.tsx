import * as React from 'react';
import { RefreshControl, View } from 'react-native';
import { ScrollView } from '@/components/ui';
import { useAccountsWithBalance } from '@/features/accounts/api';
import { todayUnix } from '@/features/formatting/helpers';
import { useScheduledTransactions } from '@/features/scheduled-transactions/hooks';
import { useRecentTransactions } from '@/features/transactions/api';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { CategorySpendingChartCard } from './category-spending-chart-card';
import { AccountsCarousel } from './components/accounts-carousel';
import { BalanceCard } from './components/balance-card';
import { HomeHeader } from './components/home-header';
import { InsightCard } from './components/insight-card';
import { MonthBudgetCard } from './components/month-budget-card';
import { NextBillRow } from './components/next-bill-row';
import { QuickActions } from './components/quick-actions';
import { RecentActivity } from './components/recent-activity';
import { SetupChecklist } from './components/setup-checklist';
import { selectNextBill } from './helpers';

const RECENT_LIMIT = 5;

export function HomeScreen() {
  const { refreshing, onRefresh } = useRefresh();
  const homeScreenChart = useAppStore.use.homeScreenChart();
  const { data: accounts = [], isPending: accountsPending } = useAccountsWithBalance();
  const { data: recent = [], isPending: recentPending } = useRecentTransactions(RECENT_LIMIT);
  const { data: rules = [] } = useScheduledTransactions();

  const total = accounts.reduce((sum, account) => sum + account.baseBalance, 0);
  const isEmpty = !recent.some((transaction) => !transaction.is_adjustment);
  const nextBill = React.useMemo(
    () => selectNextBill(rules, new Set(accounts.map((account) => account.id)), todayUnix()),
    [rules, accounts],
  );
  const isLoading = accountsPending || recentPending;

  return (
    <ScrollView className="flex-1" style={defaultStyles.transparentBg} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-wash to-background" />
      <View className="px-5 pt-2 pb-6">
        <HomeHeader isEmpty={!isLoading && isEmpty} />
        {!isLoading && (
          <View className="mt-5">
            <BalanceCard total={total} accountCount={accounts.length} isEmpty={isEmpty} />
            {isEmpty
              ? <SetupChecklist accountCount={accounts.length} />
              : (
                  <>
                    <QuickActions />
                    <InsightCard />
                    {homeScreenChart === 'category_spending' && <View className="mt-3.5"><CategorySpendingChartCard /></View>}
                    <MonthBudgetCard />
                    {nextBill && <NextBillRow bill={nextBill} />}
                    {accounts.length > 0 && <AccountsCarousel accounts={accounts} />}
                    <RecentActivity transactions={recent} />
                  </>
                )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
