import type { AccountWithBalance } from './types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import NoData from '@/components/no-data';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { FocusAwareStatusBar, Text } from '@/components/ui';
import { ChevronLeft, Plus } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { defaultStyles } from '@/lib/theme/styles';
import { useAccountNetChanges, useAccountsWithBalance, useArchivedAccounts, useUpdateAccountOrder } from './api';
import { AccountCard } from './components/account-card';
import { ArchivedAccounts } from './components/archived-accounts';
import { NetWorthCard } from './components/net-worth-card';

export function AccountsScreen() {
  const router = useRouter();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const yearMonth = useCurrentYearMonth();
  const [monthStart, monthEnd] = getCurrentMonthRange(yearMonth);
  const { data: accounts = [], isPending } = useAccountsWithBalance();
  const { data: monthDeltas = {} } = useAccountNetChanges(monthStart, monthEnd);
  const { data: archived = [] } = useArchivedAccounts();
  const updateOrder = useUpdateAccountOrder();
  const { refreshing, onRefresh } = useRefresh();

  const handleDragEnd = React.useCallback((params: { data: AccountWithBalance[] }) => {
    updateOrder.mutate(params.data.map((account, index) => ({
      id: account.id,
      sort_order: index,
    })));
  }, [updateOrder]);

  return (
    <>
      <FocusAwareStatusBar />
      <Animated.ScrollView
        ref={scrollRef}
        className="flex-1"
        style={defaultStyles.transparentBg}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-wash to-background" />
        <View className="px-5 pt-2 pb-6">
          <PageHeader
            title={translate('settings.accounts')}
            left={<HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router, '/')} />}
            right={<HeaderButton icon={Plus} label={translate('accounts.add')} onPress={() => router.push('/accounts/new')} />}
          />
          {isPending
            ? <SkeletonRows count={3} className="mt-5" />
            : (
                <>
                  <View className="mt-5 mb-[22px]">
                    <NetWorthCard accounts={accounts} />
                  </View>
                  {accounts.length === 0
                    ? <NoData title={translate('accounts.no_accounts')} className="mt-6" />
                    : (
                        <Sortable.Grid
                          data={accounts}
                          columns={1}
                          rowGap={10}
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
                              monthDelta={monthDeltas[account.id] ?? 0}
                              onPress={() => router.push(`/accounts/${account.id}`)}
                            />
                          )}
                        />
                      )}
                </>
              )}
          {archived.length > 0 && <ArchivedAccounts accounts={archived} />}
          {accounts.length > 1 && (
            <Text className="pt-4 text-center text-meta text-muted-foreground">{translate('accounts.sorting_tips')}</Text>
          )}
        </View>
      </Animated.ScrollView>
    </>
  );
}
