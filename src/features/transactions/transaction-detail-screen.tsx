import type { DetailsRowProps } from '@/components/details';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import DetailsSection, { DetailsRow } from '@/components/details';
import ScreenHeader from '@/components/screen-header';

import { Alert, FocusAwareStatusBar, FormattedCurrency, FormattedDate, GhostButton, OverflowMenu, RepeatIcon, SolidButton, Text, TrashIcon, View } from '@/components/ui';

import { NAV_BAR_HEIGHT } from '@/components/ui/nav-tab-bar';
import { useAccounts } from '@/features/accounts/api';
import { unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';
import { centsToAmount } from '../formatting/helpers';
import { useDeleteTransaction, useTransaction } from './api';
import { MerchantLogo } from './components/merchant-logo';
import { TransactionForm } from './components/transaction-form';

export function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isCompact = useAppStore.use.density() === 'compact';

  const { data: transaction, isLoading } = useTransaction(id ?? '');
  const deleteMut = useDeleteTransaction();
  const { data: accounts = [] } = useAccounts();
  const [isEditing, setIsEditing] = useState(false);
  const [showAuditTimestamps, setShowAuditTimestamps] = useState(false);

  if (isLoading || !transaction) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScreenHeader title={translate('transactions.detail_title')} />
        <View className="flex-1 items-center justify-center bg-background">
          <Text>{translate('common.loading')}</Text>
        </View>
      </>
    );
  }

  if (isEditing) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScreenHeader title={translate('transactions.edit_title')} />
        <TransactionForm
          initialValues={{ ...transaction, date: unixToISODate(transaction.date) }}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
          bottomMenuOffset={NAV_BAR_HEIGHT}
        />
      </>
    );
  }

  const isIncome = transaction.type === 'income';
  const account = accounts.find((a) => a.id === transaction.account_id);
  const primaryDetails: DetailsRowProps[] = [
    { label: translate('transactions.date'), value: <FormattedDate value={transaction.date} className="text-foreground" /> },
    { label: translate('transactions.category'), value: transaction ? `${transaction.category_icon} ${transaction.category_name}` : '-' },
    { label: translate('transactions.account'), value: account ? `${account.icon} ${account.name}` : '-' },
    { label: translate('transactions.type'), value: transaction.type, className: 'capitalize' },
    ...(transaction.merchant_name ? [{ label: translate('transactions.merchant_name'), value: transaction.merchant_name }] : []),
    ...(transaction.location ? [{ label: translate('transactions.location'), value: transaction.location }] : []),
  ];

  const handleDelete = () => {
    Alert.alert(translate('common.delete'), translate('transactions.delete_confirmation'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.delete'),
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await deleteMut.mutateAsync(id);
            goBackOrFallback(router);
          }
        },
      },
    ]);
  };

  const handleMakeRecurring = () => {
    if (transaction.type === 'transfer') return;
    router.push({
      pathname: '/scheduled/new',
      params: {
        type: transaction.type,
        currency: transaction.currency,
        amount: centsToAmount(transaction.amount),
        category_id: transaction.category_id,
        account_id: transaction.account_id,
        note: transaction.note,
        start_date: unixToISODate(transaction.date),
      },
    });
  };
  const logo = transaction.merchant_logo_slug ? <MerchantLogo slug={transaction.merchant_logo_slug} size={56} withBg={false} /> : null;
  const buttonSize = isCompact ? 'sm' : 'md';

  return (
    <>
      <ScreenHeader title={translate('transactions.detail_title')}>
        <OverflowMenu
          className="-mr-2 ml-auto"
          accessibilityLabel={translate('settings.more')}
          items={[
            {
              label: translate('transactions.make_recurring'),
              onPress: handleMakeRecurring,
              hidden: transaction.type === 'transfer',
              icon: <RepeatIcon size={16} colorClassName="accent-foreground" className="mr-2" />,
            },
            {
              label: translate('common.delete'),
              onPress: handleDelete,
              className: 'text-danger-600',
              icon: <TrashIcon size={16} colorClassName="accent-danger-600" className="mr-2" />,
            },
          ]}
        />
      </ScreenHeader>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="flex-grow px-4 pt-7 pb-4">
        <View className="flex-1">
          {!!logo && (
            <View className="mb-6 flex-row justify-center gap-2">
              {logo}
            </View>
          )}
          <View className="items-center pb-6">
            <FormattedCurrency
              value={transaction.amount}
              currency={transaction.currency}
              prefix={isIncome ? '+' : '-'}
              className={`text-3xl font-bold ${isIncome ? 'text-success-600' : ''}`}
            />
            {transaction.baseCurrency !== transaction.currency && (
              <FormattedCurrency
                value={transaction.baseAmount}
                currency={transaction.baseCurrency}
                prefix={isIncome ? '+' : '-'}
                className="text-lg text-muted-foreground"
              />
            )}
          </View>
          <DetailsSection
            className="mb-4"
            growSide="right"
            data={primaryDetails}
          >
            {showAuditTimestamps && (
              <View className="gap-3">
                <DetailsRow label={translate('transactions.created_at')} value={<FormattedDate value={transaction.created_at} className="text-foreground" />} />
                <DetailsRow label={translate('transactions.updated_at')} value={<FormattedDate value={transaction.updated_at} className="text-foreground" />} />
              </View>
            )}
            <View>
              <GhostButton
                size="sm"
                color="secondary"
                label={showAuditTimestamps ? translate('common.show_less') : translate('common.show_more')}
                onPress={() => setShowAuditTimestamps((v) => !v)}
                textClassName="underline"
              />
            </View>
          </DetailsSection>
          {!!transaction.note?.length && (
            <DetailsSection
              className="mb-4"
              growSide="right"
              data={[
                { label: translate('transactions.note'), value: transaction.note, sectionClassName: 'flex-col justify-start items-start gap-1' },
              ]}
            />
          )}
        </View>
      </ScrollView>
      <View className="flex-row gap-2 px-4 py-2">
        <GhostButton
          label={translate('common.back')}
          onPress={() => goBackOrFallback(router)}
          textClassName="text-base/tight"
          size={buttonSize}
        />
        <SolidButton
          color="primary"
          className="flex-1"
          label={translate('common.edit')}
          onPress={() => setIsEditing(true)}
          textClassName="text-base/tight"
          size={buttonSize}
        />
      </View>
    </>
  );
}
