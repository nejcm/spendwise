import { Link } from 'expo-router';
import * as React from 'react';
import { RefreshControl, View } from 'react-native';
import { Image, ScrollView } from '@/components/ui';
import { BotIcon, Settings } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { AccountsOverview } from '@/features/home/accounts-overview';
import { CategoriesOverview } from '@/features/home/categories-overview';
import { ScreensLinksGrid } from '@/features/home/screens-grid';
import { HomeRecommendations } from '@/features/recommendations/components/home-recommendations';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import Summary from './summary';
import { TransactionsList } from './transactions-list';

export function HomeScreen() {
  const theme = useThemeConfig();
  const { refreshing, onRefresh } = useRefresh();
  const density = useAppStore.use.density();
  const isCompact = density === 'compact';

  return (
    <>
      <ScrollView className="flex-1" style={defaultStyles.transparentBg} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className={`flex-col p-4 ${isCompact ? 'gap-5' : 'gap-8'}`}>
          <View className="flex-row items-center justify-between gap-2">
            <Image
              source={theme.dark ? require('../../../assets/spendwise-white.svg') : require('../../../assets/spendwise.svg')}
              className="h-[24] w-[120]"
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
