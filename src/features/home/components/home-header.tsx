import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, Text } from '@/components/ui';
import { SlidersHorizontal, Sparkle } from '@/components/ui/icon';
import { ProfileAvatar } from '@/features/profile/profile-avatar';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { getGreetingPeriod, monthName } from '../helpers';

export function HomeHeader({ isEmpty }: { isEmpty: boolean }) {
  const router = useRouter();
  const name = useAppStore.use.profile().name.trim();
  const now = new Date();
  const greeting = isEmpty ? translate('home.welcome') : translate(`home.greeting.${getGreetingPeriod(now.getHours())}`);
  const title = name ? translate('home.greeting_named', { greeting, name }) : greeting;
  const subtitle = isEmpty
    ? translate('home.welcome_subtitle')
    : translate('home.month_intro', { month: monthName(now.getMonth()) });

  return (
    <View className="h-12 flex-row items-center justify-between gap-3">
      <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={getPressedStyle} className="min-w-0 flex-1 flex-row items-center gap-3">
        <ProfileAvatar size={44} />
        <View className="min-w-0 flex-1">
          <Text className="text-base/tight font-semibold" numberOfLines={1}>{title}</Text>
          <Text className="text-meta text-muted-foreground" numberOfLines={1}>{subtitle}</Text>
        </View>
      </Pressable>
      <View className="flex-row items-center rounded-full bg-card p-1">
        <Pressable accessibilityRole="button" accessibilityLabel={translate('home.ask_ai')} onPress={() => router.push('/ai')} style={getPressedStyle} className="size-10 items-center justify-center">
          <Sparkle size={18} strokeWidth={1.8} colorClassName="accent-foreground" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={translate('common.settings')} onPress={() => router.push('/settings')} style={getPressedStyle} className="size-10 items-center justify-center">
          <SlidersHorizontal size={18} strokeWidth={1.8} colorClassName="accent-foreground" />
        </Pressable>
      </View>
    </View>
  );
}
