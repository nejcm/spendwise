import type { AccountFormData, AccountWithBalance } from './types';
import { Plus } from 'lucide-react-native';
import * as React from 'react';

import { useMemo } from 'react';
import { View } from 'react-native';
import { PeriodSelector } from '@/components/period-selector';
import { FocusAwareStatusBar, FormattedCurrency, ScrollView, SolidButton, Text } from '@/components/ui';
import { centsToAmount } from '@/features/formatting/helpers';
import { useAccountsWithBalanceForRange } from '@/features/transactions/api';
import { getPeriodRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { setPeriodSelection, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import NoData from '../../components/no-data';
import { AccountCard } from './components/account-card';

export function AccountsScreen() {
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);

  const { data: accounts = [] } = useAccountsWithBalanceForRange(startDate, endDate);

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
    <View className="flex-1">
      <FocusAwareStatusBar />

      <PeriodSelector selection={selection} onSelect={setPeriodSelection} />

      <ScrollView className="flex-1 px-4" style={defaultStyles.transparentBg}>
        <View className="flex-col items-center justify-between gap-2 px-4 pt-4 pb-6">
          <Text className="text-sm text-muted-foreground">{translate('accounts.total_balance')}</Text>
          <FormattedCurrency value={totalBalance} currency={currency} className="text-3xl font-bold" />
        </View>

        {accounts.length === 0
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
            iconLeft={<Plus className="mr-1 size-4 text-background" />}
            label={translate('common.add')}
            size="sm"
            className="px-6"
            onPress={openCreateAccountForm}
          />
        </View>

      </ScrollView>
    </View>
  );
}
