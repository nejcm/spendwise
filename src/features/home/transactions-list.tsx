import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

import { NoDataCard } from '@/components/no-data-card';
import { Text } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useRecentTransactions } from '@/features/transactions/api';
import { TransactionCard } from '@/features/transactions/components/transaction-card';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/store/local-store';

export const TransactionsList = React.memo(() => {
  const router = useRouter();
  const { data = [], isLoading } = useRecentTransactions(15);
  const hasTransactions = data.length > 0;

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-medium">{translate('home.recent_transactions')}</Text>
        {hasTransactions && (
          <GhostButton size="sm" className="px-0" onPress={() => router.push('/(app)/transactions')}>
            <Text className="text-sm font-medium text-muted-foreground">{translate('home.see_all')}</Text>
          </GhostButton>
        )}
      </View>
      {hasTransactions
        ? (
            <View>
              {data.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  className="px-0"
                />
              ))}
            </View>
          )
        : isLoading
          ? <SkeletonRows count={5} />
          : (
              <NoDataCard onPress={() => openSheet({ type: 'add-transaction' })} label={translate('home.add_transaction')} />
            )}
    </View>
  );
});
