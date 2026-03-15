import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { AccountFormData, AccountWithBalance } from './types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowRightIcon, Plus } from 'lucide-react-native';
import * as React from 'react';

import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { MonthPicker, YearPicker } from '@/components/month-year-picker';
import { FocusAwareStatusBar, Modal, ScrollView, Text } from '@/components/ui';
import { centsToAmount, formatCurrency } from '@/features/formatting/helpers';
import { useAccountsWithBalanceForMonth } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { OutlineButton } from '../../components/ui/outline-button';
import { AccountCard } from './components/account-card';
import { AccountForm } from './components/account-form';

type AccountFormMode = 'create' | 'edit';

export function AccountsScreen() {
  const currency = useAppStore.use.currency();

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = format(new Date(), 'yyyy-MM').split('-');
    return [Number(d[0]), Number(d[1])];
  });
  const [accountFormMode, setAccountFormMode] = useState<AccountFormMode>('create');
  const [selectedAccount, setSelectedAccount] = useState<AccountWithBalance | null>(null);
  const monthPickerRef = useRef<BottomSheetModal>(null);
  const yearPickerRef = useRef<BottomSheetModal>(null);
  const accountFormRef = useRef<BottomSheetModal>(null);

  const { data: accounts = [] } = useAccountsWithBalanceForMonth(selectedDate.join('-'));

  const monthName = useMemo(
    () => format(new Date(selectedDate[0], selectedDate[1] - 1, 1), 'MMMM'),
    [selectedDate],
  );

  const navigateMonth = (direction: -1 | 1) => {
    const d = new Date(selectedDate[0], selectedDate[1] - 1 + direction, 1);
    setSelectedDate([d.getFullYear(), d.getMonth() + 1]);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const closeAccountForm = React.useCallback(() => {
    accountFormRef.current?.dismiss();
  }, []);

  const handleAccountFormDismiss = React.useCallback(() => {
    setAccountFormMode('create');
    setSelectedAccount(null);
  }, []);

  const openCreateAccountForm = React.useCallback(() => {
    setAccountFormMode('create');
    setSelectedAccount(null);
    accountFormRef.current?.present();
  }, []);

  const openEditAccountForm = React.useCallback((account: AccountWithBalance) => {
    setAccountFormMode('edit');
    setSelectedAccount(account);
    accountFormRef.current?.present();
  }, []);

  const initialAccountValues = useMemo<AccountFormData | undefined>(() => {
    if (!selectedAccount) return undefined;

    return {
      name: selectedAccount.name,
      type: selectedAccount.type,
      currency: selectedAccount.currency,
      description: selectedAccount.description,
      budget:
        selectedAccount.budget != null
          ? String(centsToAmount(selectedAccount.budget))
          : null,
      icon: selectedAccount.icon,
      color: selectedAccount.color,
    };
  }, [selectedAccount]);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <View className="flex-row items-center justify-between p-4">
        <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
          <ArrowLeftIcon className="size-5 text-muted-foreground" />
        </Pressable>
        <View className="flex-row items-center gap-1">
          <Pressable onPress={() => monthPickerRef.current?.present()} hitSlop={12}>
            <Text className="text-lg font-medium">{monthName}</Text>
          </Pressable>
          <Pressable onPress={() => yearPickerRef.current?.present()} hitSlop={12}>
            <Text className="text-lg font-medium">{selectedDate[0]}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
          <ArrowRightIcon className="size-5 text-muted-foreground" />
        </Pressable>
      </View>
      <MonthPicker
        ref={monthPickerRef}
        selectedMonth={selectedDate[1]}
        onSelect={(m) => setSelectedDate((p) => [p[0], m])}
      />
      <YearPicker
        ref={yearPickerRef}
        selectedYear={selectedDate[0]}
        onSelect={(y) => setSelectedDate((p) => [y, p[1]])}
      />

      <ScrollView className="flex-1 px-4" style={defaultStyles.transparentBg}>
        <View className="flex-col items-center justify-between gap-2 px-4 pt-4 pb-6">
          <Text className="text-sm text-muted-foreground">{translate('accounts.total_balance')}</Text>
          <Text className="text-3xl font-bold">{formatCurrency(totalBalance, currency)}</Text>
        </View>

        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onPress={() => openEditAccountForm(account)}
          />
        ))}

        <View className="mt-4 flex-row items-center justify-center">
          <OutlineButton
            iconLeft={<Plus className="mr-1 size-4 text-muted-foreground" />}
            label={translate('common.add')}
            size="sm"
            color="secondary"
            className="rounded-3xl px-5"
            textClassName="font-normal text-muted-foreground"
            onPress={openCreateAccountForm}
          />
        </View>

        {accounts.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-muted-foreground">{translate('accounts.no_accounts')}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        ref={accountFormRef}
        snapPoints={['68%']}
        title={translate(accountFormMode === 'edit' ? 'accounts.edit' : 'accounts.add')}
        onDismiss={handleAccountFormDismiss}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <AccountForm
            key={selectedAccount?.id ?? 'new-account'}
            accountId={selectedAccount?.id}
            initialData={initialAccountValues}
            onSuccess={closeAccountForm}
            onCancel={closeAccountForm}
          />
        </BottomSheetScrollView>
      </Modal>
    </View>
  );
}
