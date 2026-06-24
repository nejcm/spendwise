import type { Href } from 'expo-router';
import type { UniwindLucideIcon } from '@/components/ui/icon';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, Text } from '@/components/ui';
import { Banknote, BotIcon, Calendar, Settings } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

type Destination = {
  key: string;
  labelKey: Parameters<typeof translate>[0];
  Icon: UniwindLucideIcon;
  href?: Href;
  onPress?: () => void;
};

// Routes already reachable via the bottom tab bar (Home, Categories, Transactions, Stats)
// are intentionally excluded here.
const DESTINATIONS: Destination[] = [
  { key: 'accounts', href: '/accounts', labelKey: 'settings.accounts', Icon: Banknote },
  { key: 'scheduled', href: '/scheduled', labelKey: 'scheduled.short_title', Icon: Calendar },
  { key: 'ai', href: '/ai', labelKey: 'settings.ai_chat', Icon: BotIcon },
  { key: 'settings', href: '/settings', labelKey: 'settings.title', Icon: Settings },
];

export const ScreensLinksGrid = React.memo(() => {
  const router = useRouter();
  const density = useAppStore.use.density();
  const isCompact = density === 'compact';

  return (
    <View>
      <Text className="mb-1 text-lg font-medium">{translate('home.links')}</Text>
      <View className="flex-row justify-between gap-2 md:justify-start md:gap-5">
        {DESTINATIONS.map(({ key, href, onPress, labelKey, Icon }) => (
          <Pressable
            key={key}
            onPress={href ? () => router.push(href) : onPress}
            className="items-center gap-1.5 p-1"
            style={getPressedStyle}
          >
            <View className={`items-center justify-center rounded-xl bg-card ${isCompact ? 'size-14' : 'size-15'}`}>
              <Icon size={26} strokeWidth={2} colorClassName="accent-foreground" className="my-1" />
            </View>
            <Text className="text-center text-sm text-foreground" numberOfLines={1}>
              {translate(labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});
