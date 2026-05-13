import { format } from 'date-fns';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { FormattedCurrency, getPressedStyle, Text } from '@/components/ui';
import { Skeleton, SkeletonGrid } from '@/components/ui/skeleton';
import { useMonthSummary, useMonthTrend } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

export default function Summary() {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const profile = useAppStore.use.profile();
  const name = profile?.name?.trim() || translate('common.there');
  const currentYearMonth = format(new Date(), 'yyyy-MM');
  const { data, isLoading } = useMonthSummary(currentYearMonth);
  const trend = useMonthTrend(currentYearMonth);

  return (
    <View>
      <View className="flex-row items-center justify-between gap-2">
        <View>
          <Text className="text-lg font-medium text-foreground">{translate('home.hi', { name })}</Text>
          <Text className="text-sm text-muted-foreground">{translate('home.available_balance')}</Text>
        </View>
        <View className="items-end">
          {isLoading
            ? <Skeleton height={32} width={120} />
            : <FormattedCurrency className="mt-1 text-2xl font-bold" value={data?.balance ?? 0} currency={currency} />}
        </View>
      </View>
      <View className="mt-4 flex-row gap-2">
        {isLoading
          ? (
              <SkeletonGrid cols={2} rows={1} heights={[76, 76]} />
            )
          : (
              <>
                <Pressable className="flex-1" style={getPressedStyle} onPress={() => router.push('/stats')}>
                  <View className="gap-0.5 rounded-xl bg-success-500/8 px-4 py-3 dark:bg-success-700/10">
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text className="text-sm text-foreground">{translate('home.income')}</Text>
                      {trend.incomeDeltaPct !== null && trend.incomeDeltaPct !== 0 && (
                        <Text className={`text-xs font-medium ${trend.incomeDeltaPct >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                          {trend.incomeDeltaPct >= 0 ? '↑' : '↓'}
                          {' '}
                          {Math.abs(trend.incomeDeltaPct)}
                          %
                        </Text>
                      )}
                    </View>
                    <FormattedCurrency className="text-lg font-bold text-success-600" value={data?.income ?? 0} currency={currency} prefix="+" />
                  </View>
                </Pressable>
                <Pressable className="flex-1" style={getPressedStyle} onPress={() => router.push('/stats')}>
                  <View className="gap-0.5 rounded-xl bg-danger-500/8 px-4 py-3 dark:bg-danger-600/6">
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text className="text-sm text-foreground">{translate('home.expenses')}</Text>
                      {trend.expenseDeltaPct !== null && trend.expenseDeltaPct !== 0 && (
                        <Text className={`text-xs font-medium ${trend.expenseDeltaPct <= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                          {trend.expenseDeltaPct >= 0 ? '↑' : '↓'}
                          {' '}
                          {Math.abs(trend.expenseDeltaPct)}
                          %
                        </Text>
                      )}
                    </View>
                    <FormattedCurrency className="text-lg font-bold text-danger-500" value={data?.expense ?? 0} currency={currency} prefix="-" />
                  </View>
                </Pressable>
              </>
            )}
      </View>
    </View>
  );
}
