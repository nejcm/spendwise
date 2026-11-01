/* eslint-disable react-refresh/only-export-components */
import { usePathname, useRouter } from 'expo-router';

import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChartNoAxesColumn,
  Home,
  LayoutGrid,
  List,
  Plus,
} from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { triggerScan } from '@/lib/store/local-store';
import { useAppStore } from '@/lib/store/store';
import { getPressedStyle } from './button';
import { Text } from './text';

export const NAV_BAR_HEIGHT = 50 as const;
// Bottom padding floor; the bar paints the safe-area gutter itself since the root SafeAreaView skips that edge.
export const TAB_BAR_PADDING = 8;
// Grows the 40dp tab into the bar's top padding and bottom padding floor for a 58dp target.
const TAB_HIT_SLOP = { top: 10, bottom: TAB_BAR_PADDING } as const;

const TABS = [
  { name: 'index', path: '/', icon: Home, label: 'home.title' },
  { name: 'categories', path: '/categories', icon: LayoutGrid, label: 'common.categories' },
  { name: '__add__', path: '__add__', icon: Plus, label: 'home.add_transaction' },
  { name: 'transactions', path: '/transactions', icon: List, label: 'nav.activity' },
  { name: 'stats', path: '/stats', icon: ChartNoAxesColumn, label: 'insights.title' },
] as const;

type TabConfig = (typeof TABS)[number];

export function NavTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname() || '';
  const longPressAction = useAppStore.use.longPressAction();
  const getIsActive = (tab: TabConfig): boolean => {
    if (tab.name === 'index') return pathname === '/' || pathname === '';
    return pathname.startsWith(tab.path);
  };

  return (
    <View
      accessibilityRole="tablist"
      className="flex-row items-start justify-around border-t border-border bg-card px-2 pt-2.5 dark:bg-background"
      style={{
        elevation: 0,
        minHeight: NAV_BAR_HEIGHT + Math.max(insets.bottom, TAB_BAR_PADDING),
        paddingBottom: Math.max(insets.bottom, TAB_BAR_PADDING),
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const label = translate(tab.label);

        if (tab.name === '__add__') {
          return (
            <View key="add" className="h-10 w-16 items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint={translate('nav.add_transaction_hint', {
                  action: translate(`settings.long_press_action_options.${longPressAction}`),
                })}
                onPress={() => router.push('/transactions/new')}
                onLongPress={() =>
                  triggerScan(
                    longPressAction === 'pick_from_gallery'
                      ? 'gallery'
                      : 'camera',
                  )}
                delayLongPress={400}
                style={getPressedStyle}
                className="-mt-1.5 size-[52px] items-center justify-center rounded-full bg-fab"
              >
                <Icon colorClassName="accent-fab-foreground" size={22} strokeWidth={2.2} />
              </Pressable>
            </View>
          );
        }

        const isActive = getIsActive(tab);

        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            onPress={() => isActive ? undefined : router.replace(tab.path)}
            hitSlop={TAB_HIT_SLOP}
            className="w-16 items-center gap-1"
          >
            <Icon
              colorClassName={isActive ? 'accent-foreground' : 'accent-muted-foreground'}
              size={22}
              strokeWidth={1.8}
            />
            <Text
              numberOfLines={1}
              className={cn('text-[11px] leading-[14px]', isActive ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
