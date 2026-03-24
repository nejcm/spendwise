import type { AccountFormData, AccountWithBalance } from './types';
import * as React from 'react';
import { useMemo } from 'react';

import { View } from 'react-native';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, FormattedCurrency, ScrollView, SolidButton, Text } from '@/components/ui';
import { Plus } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useAccountsWithBalanceForRange } from '@/features/accounts/api';
import { centsToAmount } from '@/features/formatting/helpers';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import NoData from '../../components/no-data';
import { AccountCard } from './components/account-card';

export function AccountsScreen() {
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);

  const { data: accounts = [], isLoading } = useAccountsWithBalanceForRange(startDate, endDate);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const openCreateAccountForm = React.useCallback(() => {
    openSheet({ type: 'add-account' });
  }, []);

  const openEditAccountForm = React.useCallback((account: AccountWithBalance) => {
    const initialData: AccountFormData = {
      name: account.name,
      type: account.type,
      currency: account.currency,
      description: account.description,
      budget: account.budget != null ? String(centsToAmount(account.budget)) : null,
      icon: account.icon,
      color: account.color,
    };
    openSheet({ type: 'edit-account', accountId: account.id, initialData });
  }, []);

  return (
    <>
      <FocusAwareStatusBar />

      <PeriodSelector selection={selection} />

      <ScrollView className="flex-1 px-4" style={defaultStyles.transparentBg}>
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
                    onPress={() => openEditAccountForm(account)}
                  />
                ))
              )}

        <View className="mt-4 flex-row items-center justify-center">
          <SolidButton
            iconLeft={<Plus className="mr-1 text-background" size={20} />}
            label={translate('common.add')}
            size="sm"
            className="px-6"
            onPress={openCreateAccountForm}
          />
        </View>

      </ScrollView>
    </>
  );
}
