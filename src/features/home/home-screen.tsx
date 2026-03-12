import { format } from 'date-fns';

import * as React from 'react';
import { View } from 'react-native';
import { Image, ScrollView, Text } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';

import { SpendingByCategory } from '@/features/home/spending-by-category';
import { useMonthSummary } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useThemeConfig } from '../../lib/theme/use-theme-config';
import TransactionsList from './transactions-list';

export function HomeScreen() {
  const theme = useThemeConfig();
  const currency = useAppStore.use.currency();
  const profile = useAppStore.use.profile();
  const name = profile?.name?.trim() || translate('common.there');
  const { data } = useMonthSummary(format(new Date(), 'yyyy-MM'));

  return (
    <>
      <ScrollView className="flex-1" style={defaultStyles.transparentBg}>
        <View className="flex-col gap-8 px-4 py-6">
          <Image
            source={theme.dark ? require('../../../assets/spendwise-white.svg') : require('../../../assets/spendwise.svg')}
            className="h-[24px] w-[120px]"
          />
          <View>
            <View className="flex-row items-center justify-between gap-2">
              <View>
                <Text className="text-lg font-medium text-foreground">{translate('home.hi', { name })}</Text>
                <Text className="text-sm text-muted-foreground">{translate('home.available_balance')}</Text>
              </View>
              <View className="items-end">
                <Text className="mt-1 text-2xl font-bold">{formatCurrency(data?.balance ?? 0, currency)}</Text>
              </View>
            </View>
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 gap-1 rounded-xl bg-success-500/8 px-4 py-3 dark:bg-success-700/10">
                <Text className="text-lg font-bold text-success-600">
                  +
                  {' '}
                  {formatCurrency(data?.income ?? 0, currency)}
                </Text>
                <Text className="text-sm text-muted-foreground">{translate('home.income')}</Text>
              </View>
              <View className="flex-1 gap-1 rounded-xl bg-danger-500/8 px-4 py-3 dark:bg-danger-600/6">
                <Text className="text-lg font-bold text-danger-500">
                  -
                  {' '}
                  {formatCurrency(data?.expense ?? 0, currency)}
                </Text>
                <Text className="text-sm text-muted-foreground">{translate('home.expenses')}</Text>
              </View>
            </View>
          </View>
          <SpendingByCategory />
          <TransactionsList />
        </View>
      </ScrollView>
    </>
  );
}
