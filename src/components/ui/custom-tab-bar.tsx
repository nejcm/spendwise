import type { SheetConfig } from '@/lib/sheet';
import { usePathname, useRouter } from 'expo-router';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Home, LayoutGrid, PieChart, PlusIcon, UserIcon } from '@/components/ui/icon';
import { openSheet } from '@/lib/local-store';

type TabConfig = {
  name: string;
  path: string;
  icon: (color: string) => React.ReactNode;
};

const TABS: TabConfig[] = [
  {
    name: 'index',
    path: '/',
    icon: (color) => <Home color={color} size={24} strokeWidth={2} />,
  },
  {
    name: 'categories',
    path: '/categories',
    icon: (color) => <LayoutGrid color={color} size={24} strokeWidth={2} />,
  },
  {
    name: '__add__',
    path: '__add__',
    icon: (color) => <PlusIcon color={color} size={24} strokeWidth={2} />,
  },
  /* {
    name: 'transactions',
    path: '/transactions',
    icon: (color) => <Receipt color={color} size={24} strokeWidth={2} />,
  }, */
  {
    name: 'stats',
    path: '/stats',
    icon: (color) => <PieChart color={color} size={24} strokeWidth={2} />,
  },
  {
    name: 'settings',
    path: '/settings',
    icon: (color) => <UserIcon color={color} size={24} strokeWidth={2} />,
  },
];

function sheetConfigForPathname(pathname: string): SheetConfig {
  if (pathname.startsWith('/accounts')) return { type: 'add-account' };
  if (pathname.startsWith('/scheduled')) return { type: 'add-scheduled' };
  if (pathname.startsWith('/categories')) return { type: 'add-category' };
  return { type: 'add-transaction' };
}

export function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname() || '';

  const getIsActive = (tab: TabConfig): boolean => {
    if (tab.name === 'index') return pathname === '/' || pathname === '';
    return pathname.startsWith(tab.path);
  };

  return (
    <View
      className="flex-row border-t border-gray-200 bg-white p-2"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {TABS.map((tab) => {
        const isAddButton = tab.name === '__add__';

        if (isAddButton) {
          return (
            <View key="add" className="flex-1 items-center justify-center">
              <Pressable
                onPress={() => openSheet(sheetConfigForPathname(pathname))}
                className="size-12 items-center justify-center rounded-full bg-gray-950"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                {tab.icon('#ffffff')}
              </Pressable>
            </View>
          );
        }

        const isActive = getIsActive(tab);
        const iconColor = isActive ? '#000000' : '#A3A3A3';

        return (
          <Pressable
            key={tab.name}
            onPress={() => router.replace(tab.path as never)}
            className="flex-1 items-center justify-center gap-1"
          >
            {tab.icon(iconColor)}
            {isActive && (
              <View className="size-1 rounded-full bg-black" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
