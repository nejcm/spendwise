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
  const { data = [] } = useRecentTransactions(15);

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-medium">{translate('home.recent_transactions')}</Text>
        <Pressable onPress={() => router.push('/(app)/transactions')}>
          <Text className="text-sm font-medium text-muted-foreground">{translate('home.see_all')}</Text>
        </Pressable>
      </View>
      {data.length === 0
        ? (
            <View className="mt-4 items-center rounded-xl bg-gray-50 py-8 dark:bg-gray-800">
              <Text className="mb-2 text-muted-foreground">{translate('home.no_transactions')}</Text>
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
            <View className="mt-2">
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
