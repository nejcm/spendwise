import type { AccountWithBalance } from './types';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import NoData from '@/components/no-data';
import { PeriodSelector } from '@/components/period-selector';
import { PeriodSwipeContainer } from '@/components/period-swipe-container';
import { FocusAwareStatusBar, FormattedCurrency, Text } from '@/components/ui';
import { Lightbulb } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { accountsWithBalanceForRangeQueryOptions, useAccountsWithBalanceForRange, useUpdateAccountOrder } from '@/features/accounts/api';
import { usePrefetchAdjacentPeriods } from '@/lib/data/prefetch';
import { getPeriodRange } from '@/lib/date/helpers';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { AccountCard } from './components/account-card';
import { AddAccountCard } from './components/add-account-card';

export function AccountsScreen() {
  const router = useRouter();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);

  const { data: accounts = [], isLoading } = useAccountsWithBalanceForRange(startDate, endDate);
  const updateOrder = useUpdateAccountOrder();

  const db = useSQLiteContext();
  usePrefetchAdjacentPeriods(selection, (start, end) => accountsWithBalanceForRangeQueryOptions(db, start, end));

  const totalBalance = accounts.reduce((sum, a) => sum + a.baseBalance, 0);
  const { refreshing, onRefresh } = useRefresh();

  const openCreateAccountForm = React.useCallback(() => {
    router.push('/accounts/new');
  }, [router]);

  const handleDragEnd = React.useCallback((params: { data: AccountWithBalance[] }) => {
    updateOrder.mutate(params.data.map((account, index) => ({
      id: account.id,
      sort_order: index,
    })));
  }, [updateOrder]);

  return (
    <PeriodSwipeContainer selection={selection}>
      <FocusAwareStatusBar />

      <PeriodSelector selection={selection} />

      <Animated.ScrollView
        ref={scrollRef}
        className="flex-1"
        style={defaultStyles.transparentBg}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-6">
          <View className="flex-col items-center justify-between gap-2 px-4 pt-4 pb-6">
            <Text className="text-sm text-muted-foreground">{translate('accounts.total_balance')}</Text>
            <FormattedCurrency value={totalBalance} currency={currency} className="text-3xl font-bold" />
          </View>
          {isLoading
            ? <SkeletonRows count={3} />
            : accounts.length === 0
              ? (
                  <NoData title={translate('accounts.no_accounts')} className="mt-6" />
                )
              : (
                  <>
                    <Sortable.Grid
                      data={accounts}
                      columns={1}
                      hapticsEnabled
                      scrollableRef={scrollRef}
                      dimensionsAnimationType="none"
                      itemEntering={null}
                      itemExiting={null}
                      itemsLayoutTransitionMode="reorder"
                      keyExtractor={(account) => account.id}
                      onDragEnd={handleDragEnd}
                      renderItem={({ item: account }) => (
                        <AccountCard
                          account={account}
                          onPress={() => router.push(`/accounts/${account.id}`)}
                        />
                      )}
                    />
                    <View className="mt-3 mb-5 flex-row items-center justify-center gap-2">
                      <Lightbulb className="text-muted-foreground" size={14} />
                      <Text className="text-sm text-muted-foreground">
                        {translate('accounts.sorting_tips')}
                      </Text>
                    </View>
                  </>
                )}

          <AddAccountCard onPress={openCreateAccountForm} />
        </View>
      </Animated.ScrollView>
    </PeriodSwipeContainer>
  );
}
