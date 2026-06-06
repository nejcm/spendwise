import type { LoaderDimensions } from '../../components/ui/skeleton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo } from 'react';

import { RefreshControl, ScrollView, View } from 'react-native';
import { PeriodSelector } from '@/components/period-selector';
import { PeriodSwipeContainer } from '@/components/period-swipe-container';
import ScreenHeader from '@/components/screen-header';
import { FocusAwareStatusBar, IconButton, Pencil } from '@/components/ui';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useTransactions } from '@/features/transactions/api';
import { TransactionList } from '@/features/transactions/components/transaction-list';
import { queryKeys } from '@/lib/data/query-keys';
import { getPeriodRange } from '@/lib/date/helpers';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useAccountsWithBalanceForRange } from './api';
import { AccountSummary } from './components/account-summary';

const loaderDimensions: LoaderDimensions = [['100%', 75, 'mb-8'], ['100%', 25], ['100%', 45], ['100%', 45], ['100%', 45]];

export function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);
  const refreshKeys = useMemo(() => [
    queryKeys.accounts.withBalanceForRange(startDate, endDate),
    queryKeys.accounts.summaryForRange(id, startDate, endDate),
    queryKeys.transactions.list(`${startDate}/${endDate}`),
  ] as const, [endDate, id, startDate]);
  const { refreshing, onRefresh } = useRefresh(refreshKeys);

  const { data: accounts = [], isLoading: accountsLoading } = useAccountsWithBalanceForRange(startDate, endDate);
  const account = useMemo(() => accounts.find((a) => a.id === id), [accounts, id]);

  const { data: allTransactions = [], isLoading: txLoading } = useTransactions(startDate, endDate);
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.account_id === id),
    [allTransactions, id],
  );

  const openEditForm = React.useCallback(() => {
    if (!account) return;
    router.push({ pathname: '/accounts/[id]/edit', params: { id: account.id } });
  }, [account, router]);

  if (accountsLoading || !account) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScreenHeader title={translate('accounts.detail_title')} />
        <View className="flex-1 px-4 py-10">
          <SkeletonRows
            count={5}
            dimensions={loaderDimensions}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <FocusAwareStatusBar />
      <PeriodSwipeContainer selection={selection}>
        <ScreenHeader title={`${account.icon ?? ''} ${account.name}`}>
          <IconButton className="ml-auto" color="none" onPress={openEditForm}>
            <Pencil className="text-muted-foreground" size={18} />
          </IconButton>
        </ScreenHeader>

        <PeriodSelector selection={selection} />

        <ScrollView
          className="flex-1"
          style={defaultStyles.transparentBg}
          contentContainerClassName="pt-4 pb-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <AccountSummary
            accountId={id}
            startDate={startDate}
            endDate={endDate}
            currency={currency}
          />

          <TransactionList
            transactions={transactions}
            isLoading={txLoading}
          />
        </ScrollView>
      </PeriodSwipeContainer>
    </>
  );
}
