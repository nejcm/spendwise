import { useRouter } from 'expo-router';

import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { useRecentTransactions } from '@/features/transactions/api';
import { TransactionCard } from '@/features/transactions/components/transaction-card';
import { translate } from '@/lib/i18n';
import { NoDataCard } from '../../components/no-data-card';

export default function TransactionsList() {
  const router = useRouter();
  const { data = [] } = useRecentTransactions(15);
  const hasTransactions = data.length > 0;

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-medium">{translate('home.recent_transactions')}</Text>
        {hasTransactions && (
          <GhostButton size="sm" className="px-0" onPress={() => router.push('/(app)/transactions')}>
            <Text className="text-muted-foreground text-sm font-medium">{translate('home.see_all')}</Text>
          </GhostButton>
        )}
      </View>
      {!hasTransactions
        ? (
            <NoDataCard onPress={() => router.push('/transactions/add')} label={translate('home.add_transaction')} />
          )
        : (
            <View>
              {data.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  onPress={() => router.push(`/transactions/${t.id}`)}
                  className="px-0"
                />
              ))}
            </View>
          )}
    </View>
  );
}
