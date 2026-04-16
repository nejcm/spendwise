import type { LoaderDimensions } from '../../components/ui/skeleton';
import type { AccountFormData } from './types';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useMemo } from 'react';

import { ScrollView, View } from 'react-native';
import { PeriodSelector } from '@/components/period-selector';
import { PeriodSwipeContainer } from '@/components/period-swipe-container';
import ScreenHeader from '@/components/screen-header';
import { FocusAwareStatusBar, IconButton, Pencil } from '@/components/ui';
import { SkeletonRows } from '@/components/ui/skeleton';
import { centsToAmount } from '@/features/formatting/helpers';
import { useTransactions } from '@/features/transactions/api';
import { TransactionList } from '@/features/transactions/components/transaction-list';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/store/local-store';
import { useAppStore } from '@/lib/store/store';
import { useAccountsWithBalanceForRange } from './api';
import { AccountSummary } from './components/account-summary';

const loaderDimensions: LoaderDimensions = [['100%', 75, 'mb-8'], ['100%', 25], ['100%', 45], ['100%', 45], ['100%', 45]];

export function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);

  const { data: accounts = [], isLoading: accountsLoading } = useAccountsWithBalanceForRange(startDate, endDate);
  const account = useMemo(() => accounts.find((a) => a.id === id), [accounts, id]);

  const { data: allTransactions = [], isLoading: txLoading } = useTransactions(startDate, endDate);
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.account_id === id),
    [allTransactions, id],
  );

  const openEditForm = React.useCallback(() => {
    if (!account) return;
    const initialData: AccountFormData = {
      ...account,
      budget: account.budget != null ? String(centsToAmount(account.budget)) : null,
    };
    openSheet({ type: 'edit-account', accountId: account.id, initialData });
  }, [account]);

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

        <ScrollView className="flex-1" contentContainerClassName="pt-4 pb-6">
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
