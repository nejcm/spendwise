import { format } from 'date-fns';
import { Link } from 'expo-router';
import * as React from 'react';
import { RefreshControl, View } from 'react-native';
import { Image, ScrollView, Text } from '@/components/ui';
import { BotIcon, Settings } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { AccountsOverview } from '@/features/home/accounts-overview';
import { CategoriesOverview } from '@/features/home/categories-overview';
import { ScreensLinksGrid } from '@/features/home/screens-grid';
import { HomeRecommendations } from '@/features/recommendations/components/home-recommendations';
import { queryKeys } from '@/lib/data/query-keys';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { getAvatar } from '../profile';
import Summary from './summary';
import { TransactionsList } from './transactions-list';

export function HomeScreen() {
  const theme = useThemeConfig();
  const currentYearMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [monthStart, monthEnd] = React.useMemo(() => getCurrentMonthRange(currentYearMonth), [currentYearMonth]);
  const refreshKeys = React.useMemo(() => [
    queryKeys.monthSummary.all,
    queryKeys.accounts.withBalanceForRange(monthStart, monthEnd),
    queryKeys.insights.categorySpendRange(monthStart, monthEnd),
    queryKeys.transactions.recent(10),
    queryKeys.globalBudget.all,
    queryKeys.globalBudget.spend(monthStart, monthEnd),
    queryKeys.recommendations.home,
  ] as const, [monthEnd, monthStart]);
  const { refreshing, onRefresh } = useRefresh(refreshKeys);
  const density = useAppStore.use.density();
  const isCompact = density === 'compact';
  const profile = useAppStore.use.profile();
  const name = profile?.name?.trim() || translate('common.there');
  const avatar = profile?.avatar;

  return (
    <>
      <ScrollView className="flex-1" style={defaultStyles.transparentBg} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className={`flex-col p-4 ${isCompact ? 'gap-5' : 'gap-8'}`}>
          {/* <View className="flex-row items-center justify-between gap-2">
            <Image
              source={theme.dark ? require('../../../assets/spendwise-white.svg') : require('../../../assets/spendwise.svg')}
              className="h-[26] w-[132]"
            />
            <View className="flex-row items-center gap-2">
              <Link href="/ai" asChild>
                <IconButton size="sm" color="secondary">
                  <BotIcon size={21} colorClassName="accent-muted-foreground" />
                </IconButton>
              </Link>
              <Link href="/settings" asChild>
                <IconButton size="sm" color="secondary">
                  <Settings size={21} colorClassName="accent-muted-foreground" />
                </IconButton>
              </Link>
            </View>
          </View> */}
          <View className="flex-row items-center gap-4 py-2">
            <Image source={getAvatar(avatar)} className="size-12 rounded-full" />
            <View>
              <Text className="text-xl/tight font-medium text-foreground">{translate('home.hi', { name })}</Text>
              <Text className="text-sm text-muted-foreground">{format(new Date(), 'MMMM yyyy')}</Text>
            </View>
            <View className="ml-auto flex-row items-center gap-2">
              <Link href="/ai" asChild>
                <IconButton size="md" color="secondary">
                  <BotIcon size={20} colorClassName="accent-subtle-5" />
                </IconButton>
              </Link>
              <Link href="/settings" asChild>
                <IconButton size="md" color="secondary">
                  <Settings size={20} colorClassName="accent-subtle-5" />
                </IconButton>
              </Link>
            </View>
          </View>
          <Summary />
          <HomeRecommendations />
          <AccountsOverview />
          <CategoriesOverview />
          <ScreensLinksGrid />
          <TransactionsList />
        </View>
      </ScrollView>
    </>
  );
}
