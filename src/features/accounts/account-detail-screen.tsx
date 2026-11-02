import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { PeriodPill } from '@/components/period-pill';
import { FocusAwareStatusBar, SolidButton, Text } from '@/components/ui';
import { ArrowLeftRight, ChevronLeft, Pencil, Plus } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useTransactions } from '@/features/transactions/api';
import { TransactionList } from '@/features/transactions/components/transaction-list';
import { TransactionSelectionToolbar } from '@/features/transactions/components/transaction-selection-toolbar';
import { useTransactionSelection } from '@/features/transactions/hooks/selection';
import { queryKeys } from '@/lib/data/query-keys';
import { usePeriodRange } from '@/lib/hooks/use-current-year-month';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useAccounts } from './api';
import { AccountHero } from './components/account-hero';

const REFRESH_KEYS = [queryKeys.accounts.all, queryKeys.transactions.all] as const;

export function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = usePeriodRange(selection);
  const { refreshing, onRefresh } = useRefresh(REFRESH_KEYS);

  const { data: accounts, isPending: accountsPending } = useAccounts();
  const account = accounts?.find((a) => a.id === id);

  const { data: allTransactions = [], isLoading: txLoading } = useTransactions(startDate, endDate);
  const transactions = React.useMemo(() => allTransactions.filter((t) => t.account_id === id), [allTransactions, id]);
  const {
    selectionMode,
    selectedIds,
    selectedCount,
    toggleSelection,
    startSelection,
    clearSelection,
    deleteSelected,
  } = useTransactionSelection(transactions);

  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          style={defaultStyles.transparentBg}
          contentContainerClassName="pb-8"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View pointerEvents="none" className="absolute inset-x-0 top-0 h-85 bg-linear-to-b from-wash to-background" />
          <View className="px-5 pt-2">
            <PageHeader
              left={<HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router, '/accounts')} />}
              right={account && (
                <HeaderButton
                  icon={Pencil}
                  label={translate('common.edit')}
                  onPress={() => router.push({ pathname: '/accounts/[id]/edit', params: { id: account.id } })}
                />
              )}
            >
              <PeriodPill selection={selection} />
            </PageHeader>

            {accountsPending
              ? <SkeletonRows count={3} className="mt-5" />
              : !account
                  ? <Text className="mt-10 text-center text-muted-foreground">{translate('accounts.not_found')}</Text>
                  : (
                      <>
                        <AccountHero account={account} startDate={startDate} endDate={endDate} />
                        <View className="mt-3.5 flex-row gap-2.5">
                          <SolidButton
                            color="primary"
                            className="flex-1"
                            label={translate('home.actions.add')}
                            iconLeft={<Plus size={18} colorClassName="accent-primary-foreground" />}
                            onPress={() => router.push({ pathname: '/transactions/new', params: { account_id: account.id } })}
                          />
                          <SolidButton
                            color="secondary"
                            className="flex-1"
                            label={translate('accounts.transfer')}
                            iconLeft={<ArrowLeftRight size={18} colorClassName="accent-foreground" />}
                            onPress={() => router.push({ pathname: '/transactions/new', params: { type: 'transfer', account_id: account.id } })}
                          />
                        </View>
                      </>
                    )}
          </View>

          {account && (
            <View className="mt-4">
              <TransactionList
                transactions={transactions}
                isLoading={txLoading}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelect={toggleSelection}
                onStartSelection={startSelection}
              />
            </View>
          )}
        </ScrollView>
        {selectionMode && (
          <TransactionSelectionToolbar selectedCount={selectedCount} onClear={clearSelection} onDelete={deleteSelected} />
        )}
      </View>
    </>
  );
}
