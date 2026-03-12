import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Button, Text } from '@/components/ui';

import { useRecentTransactions } from '@/features/transactions/api';
import { TransactionCard } from '@/features/transactions/components/transaction-card';
import { translate } from '@/lib/i18n';

export default function TransactionsList() {
  const router = useRouter();
  const { data: recentTransactions = [] } = useRecentTransactions(15);

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold">{translate('home.recent_transactions')}</Text>
        <Pressable onPress={() => router.push('/(app)/transactions')}>
          <Text className="text-sm font-semibold text-neutral-500">{translate('home.see_all')}</Text>
        </Pressable>
      </View>
      {recentTransactions.length === 0
        ? (
            <View className="mt-4 items-center rounded-xl bg-neutral-50 py-8 dark:bg-neutral-800">
              <Text className="mb-2 text-neutral-500">{translate('home.no_transactions')}</Text>
              <Button
                label={translate('common.add')}
                size="sm"
                iconLeft={<Plus className="mr-1 size-4 text-background" />}
                onPress={() => router.push('/transactions/add')}
              >
              </Button>
            </View>
          )
        : (
            <View className="mt-4 rounded-xl bg-neutral-100 dark:bg-neutral-800">
              {recentTransactions.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  onPress={() => router.push(`/transactions/${t.id}`)}
                />
              ))}
            </View>
          )}
    </View>
  );
}
