import type { Href } from 'expo-router';
import type { UniwindLucideIcon } from '@/components/ui/icon';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, Text } from '@/components/ui';
import { Banknote, BotIcon, Calendar, LayoutGrid, ListChecks, PieChart, ScanLine, Settings } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { triggerScanPicker } from '../../lib/store/local-store';

type Destination = {
  key: string;
  labelKey: Parameters<typeof translate>[0];
  Icon: UniwindLucideIcon;
  href?: Href;
  onPress?: () => void;
};

const DESTINATIONS: Destination[] = [
  { key: 'accounts', href: '/accounts', labelKey: 'settings.accounts', Icon: Banknote },
  { key: 'transactions', href: '/transactions', labelKey: 'transactions.title', Icon: ListChecks },
  { key: 'categories', href: '/categories', labelKey: 'common.categories', Icon: LayoutGrid },
  { key: 'stats', href: '/stats', labelKey: 'stats.title', Icon: PieChart },
  { key: 'scheduled', href: '/scheduled', labelKey: 'scheduled.title', Icon: Calendar },
  { key: 'settings', href: '/settings', labelKey: 'settings.title', Icon: Settings },
  { key: 'ai', href: '/ai', labelKey: 'settings.ai_chat', Icon: BotIcon },
  { key: 'scan', onPress: triggerScanPicker, labelKey: 'settings.scan', Icon: ScanLine },
];

export function ScreensLinksGrid() {
  const router = useRouter();

  return (
    <View>
      <Text className="mb-2 text-lg font-medium">{translate('home.links')}</Text>
      <View className="flex-row flex-wrap gap-2">
        {DESTINATIONS.map(({ key, href, onPress, labelKey, Icon }) => (
          <Pressable
            key={key}
            onPress={href ? () => router.push(href) : onPress}
            className="min-w-[48%] flex-1 flex-row items-center gap-1 rounded-xl bg-card px-2 py-1.5"
            style={getPressedStyle}
          >
            <View className="size-10 items-center justify-center">
              <Icon size={22} strokeWidth={2} colorClassName="accent-foreground" />
            </View>
            <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
              {translate(labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
