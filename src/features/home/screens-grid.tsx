import type { Href } from 'expo-router';
import type { UniwindLucideIcon } from '@/components/ui/icon';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { getPressedStyle, Text } from '@/components/ui';
import { Banknote, BotIcon, Calendar, ScanLine, Settings } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { triggerScanPicker } from '../../lib/store/local-store';

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
  { key: 'scan', onPress: triggerScanPicker, labelKey: 'settings.scan', Icon: ScanLine },
  { key: 'settings', href: '/settings', labelKey: 'settings.title', Icon: Settings },
];

export const ScreensLinksGrid = React.memo(() => {
  const router = useRouter();

  return (
    <View>
      <Text className="mb-2 text-lg font-medium">{translate('home.links')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {DESTINATIONS.map(({ key, href, onPress, labelKey, Icon }) => (
          <Pressable
            key={key}
            onPress={href ? () => router.push(href) : onPress}
            className="w-24 items-center gap-1.5 rounded-xl bg-card px-2 py-3"
            style={getPressedStyle}
          >
            <Icon size={30} strokeWidth={2} colorClassName="accent-foreground" className="my-1" />
            <Text className="text-center text-xs font-medium text-foreground" numberOfLines={1}>
              {translate(labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});
