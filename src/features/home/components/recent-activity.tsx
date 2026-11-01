import type { TransactionWithCategory } from '@/features/transactions/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { SectionHeader } from '@/components/ui';
import { TransactionCard } from '@/features/transactions/components/transaction-card';
import { translate } from '@/lib/i18n';

export function RecentActivity({ transactions }: { transactions: TransactionWithCategory[] }) {
  const router = useRouter();

  return (
    <View>
      <SectionHeader title={translate('home.recent_activity')} onSeeAll={() => router.push('/transactions')} className="px-0 pt-6 pb-1" titleClassName="text-header-title font-semibold text-foreground" />
      {transactions.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} showDate className="px-0" />)}
    </View>
  );
}
