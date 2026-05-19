import type { AccountWithBalance } from './types';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import NoData from '@/components/no-data';
import { PeriodSelector } from '@/components/period-selector';
import { PeriodSwipeContainer } from '@/components/period-swipe-container';
import { FocusAwareStatusBar, FormattedCurrency, ScrollView, Text } from '@/components/ui';
import { SkeletonRows } from '@/components/ui/skeleton';
import { accountsWithBalanceForRangeQueryOptions, useAccountsWithBalanceForRange } from '@/features/accounts/api';
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
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);

  const { data: accounts = [], isLoading } = useAccountsWithBalanceForRange(startDate, endDate);

  const db = useSQLiteContext();
  usePrefetchAdjacentPeriods(selection, (start, end) => accountsWithBalanceForRangeQueryOptions(db, start, end));

  const totalBalance = accounts.reduce((sum, a) => sum + a.baseBalance, 0);
  const { refreshing, onRefresh } = useRefresh();

  const openCreateAccountForm = React.useCallback(() => {
    router.push('/accounts/new');
  }, [router]);

  const openEditAccountForm = React.useCallback((account: AccountWithBalance) => {
    router.push({ pathname: '/accounts/[id]/edit', params: { id: account.id } });
  }, [router]);

  return (
    <PeriodSwipeContainer selection={selection}>
      <FocusAwareStatusBar />

      <PeriodSelector selection={selection} />

      <ScrollView className="flex-1" style={defaultStyles.transparentBg} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
                  accounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onPress={() => router.push(`/accounts/${account.id}`)}
                      onLongPress={() => openEditAccountForm(account)}
                    />
                  ))
                )}

          <AddAccountCard onPress={openCreateAccountForm} />
        </View>
      </ScrollView>
    </PeriodSwipeContainer>
  );
}
