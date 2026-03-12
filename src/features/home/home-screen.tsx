import { format } from 'date-fns';

import * as React from 'react';
import { View } from 'react-native';
import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';

import { SpendingByCategory } from '@/features/home/spending-by-category';
import { useTotalBalance } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { config } from '../../config';
import TransactionsList from './transactions-list';

export function HomeScreen() {
  const currency = useAppStore.use.currency();
  const profile = useAppStore.use.profile();
  const name = profile?.name?.trim() || translate('common.there');
  const { data: totalBalance = 0 } = useTotalBalance(format(new Date(), 'MM'));

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1">
        <View className="flex-col gap-8 px-4 py-6">
          <Text className="text-2xl font-bold text-foreground">{config.appName}</Text>
          <View className="flex-row items-center justify-between gap-2">
            <View>
              <Text className="text-lg font-semibold text-foreground">{translate('home.hi', { name })}</Text>
              <Text className="text-sm text-neutral-500">{translate('home.available_balance')}</Text>
            </View>
            <View className="items-end">
              <Text className="mt-1 text-2xl font-bold">{formatCurrency(totalBalance, currency)}</Text>
            </View>
          </View>
          <SpendingByCategory />
          <TransactionsList />
        </View>
      </ScrollView>
    </View>
  );
}
