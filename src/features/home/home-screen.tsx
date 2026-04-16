import { format } from 'date-fns';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { FormattedCurrency, getPressedStyle, Image, ScrollView, Text } from '@/components/ui';
import { BotIcon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { SkeletonBox, SkeletonGrid } from '@/components/ui/skeleton';
import { AccountsOverview } from '@/features/home/accounts-overview';
import { CategoriesOverview } from '@/features/home/categories-overview';
import { ScreensLinksGrid } from '@/features/home/screens-grid';
import { useMonthSummary } from '@/features/transactions/api';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import TransactionsList from './transactions-list';

export function HomeScreen() {
  const theme = useThemeConfig();
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const profile = useAppStore.use.profile();
  const name = profile?.name?.trim() || translate('common.there');
  const { data, isLoading } = useMonthSummary(format(new Date(), 'yyyy-MM'));
  const { refreshing, onRefresh } = useRefresh();

  return (
    <>
      <ScrollView className="flex-1" style={defaultStyles.transparentBg} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="flex-col gap-8 p-4">
          <View className="flex-row items-center justify-between gap-2">
            <Image
              source={theme.dark ? require('../../../assets/spendwise-white.svg') : require('../../../assets/spendwise.svg')}
              className="h-[24] w-[120]"
            />
            <View className="flex-row items-center gap-2">
              <IconButton size="sm" color="secondary" onPress={() => router.push('/ai')}>
                <BotIcon size={22} className="text-muted-foreground" />
              </IconButton>
            </View>
          </View>
          <View>
            <View className="flex-row items-center justify-between gap-2">
              <View>
                <Text className="text-lg font-medium text-foreground">{translate('home.hi', { name })}</Text>
                <Text className="text-sm text-muted-foreground">{translate('home.available_balance')}</Text>
              </View>
              <View className="items-end">
                {isLoading
                  ? <SkeletonBox height={32} width={120} />
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
                      <Pressable onPress={() => router.push('/stats')} style={getPressedStyle} className="flex-1">
                        <View className="gap-1 rounded-xl bg-success-500/8 px-4 py-3 dark:bg-success-700/10">
                          <FormattedCurrency className="text-lg font-bold text-success-600" value={data?.income ?? 0} currency={currency} prefix="+" />
                          <Text className="text-sm text-muted-foreground">{translate('home.income')}</Text>
                        </View>
                      </Pressable>
                      <Pressable onPress={() => router.push('/stats')} style={getPressedStyle} className="flex-1">
                        <View className="gap-1 rounded-xl bg-danger-500/8 px-4 py-3 dark:bg-danger-600/6">
                          <FormattedCurrency className="text-lg font-bold text-danger-500" value={data?.expense ?? 0} currency={currency} prefix="-" />
                          <Text className="text-sm text-muted-foreground">{translate('home.expenses')}</Text>
                        </View>
                      </Pressable>
                    </>
                  )}
            </View>
          </View>
          <AccountsOverview />
          <CategoriesOverview />
          <ScreensLinksGrid />
          <TransactionsList />
        </View>
      </ScrollView>
    </>
  );
}
