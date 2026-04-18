/* eslint-disable react-refresh/only-export-components */
import { usePathname, useRouter } from 'expo-router';

import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Home, LayoutGrid, PieChart, PlusIcon, UserIcon } from '@/components/ui/icon';
import { openSheet, triggerScan } from '@/lib/store/local-store';
import { useAppStore } from '@/lib/store/store';

export const TAB_BAR_COLOR = '#f6f6f6' as const;
export const TAB_BAR_DARK_COLOR = '#17191C' as const;
const bgColor = `bg-gray-50`;
const darkBgColor = `dark:bg-[#17191C]`;

type TabConfig = {
  name: string;
  path: string;
  icon: typeof Home;
};

const TABS: TabConfig[] = [
  {
    name: 'index',
    path: '/',
    icon: Home,
  },
  {
    name: 'categories',
    path: '/categories',
    icon: LayoutGrid,
  },
  {
    name: '__add__',
    path: '__add__',
    icon: PlusIcon,
  },
  /* {
    name: 'transactions',
    path: '/transactions',
    icon: Receipt,
  }, */
  {
    name: 'stats',
    path: '/stats',
    icon: PieChart,
  },
  {
    name: 'settings',
    path: '/settings',
    icon: UserIcon,
  },
];

export function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const longPressAction = useAppStore.use.longPressAction();
  const getIsActive = (tab: TabConfig): boolean => {
    if (tab.name === 'index') return pathname === '/' || pathname === '';
    return pathname.startsWith(tab.path);
  };

  return (
    <View
      className={`flex-row border-t border-gray-200 p-2 dark:border-gray-800 ${bgColor} ${darkBgColor}`}
      style={{ elevation: 0 }}
    >
      {TABS.map((tab) => {
        const isAddButton = tab.name === '__add__';
        const Icon = tab.icon;

        if (isAddButton) {
          return (
            <View key="add" className="flex-1 items-center justify-center">
              <Pressable
                onPress={() => openSheet({ type: 'add-transaction' })}
                onLongPress={() => triggerScan(longPressAction === 'pick_from_gallery' ? 'gallery' : 'camera')}
                delayLongPress={400}
                className="size-12 items-center justify-center rounded-full bg-gray-950 dark:bg-white"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Icon colorClassName="accent-background" size={24} strokeWidth={2} />
              </Pressable>
            </View>
          );
        }

        const isActive = getIsActive(tab);

        return (
          <Pressable
            key={tab.name}
            onPress={() => router.replace(tab.path as never)}
            className="flex-1 items-center justify-center gap-1"
          >
            <Icon colorClassName={isActive ? 'accent-foreground' : 'accent-gray-500'} size={24} strokeWidth={2} />
            {isActive && (
              <View className="size-1 rounded-full bg-black dark:bg-white" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
