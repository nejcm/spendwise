import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { usePathname, useRouter } from 'expo-router';
import { Home, LayoutGrid, PieChart, PlusIcon, UserIcon } from 'lucide-react-native';

import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { QuickAddSheet } from '../../features/transactions/components/quick-add-sheet';

type TabConfig = {
  name: string;
  icon: (color: string) => React.ReactNode;
};

const TABS: TabConfig[] = [
  {
    name: 'index',
    icon: (color) => <Home color={color} size={24} strokeWidth={2} />,
  },
  {
    name: 'categories',
    icon: (color) => <LayoutGrid color={color} size={24} strokeWidth={2} />,
  },
  {
    name: '__add__',
    icon: (color) => <PlusIcon color={color} size={24} strokeWidth={2} />,
  },
  /* {
    name: 'transactions',
    icon: (color) => <Receipt color={color} size={24} strokeWidth={2} />,
  }, */
  {
    name: 'stats',
    icon: (color) => <PieChart color={color} size={24} strokeWidth={2} />,
  },
  {
    name: 'settings',
    icon: (color) => <UserIcon color={color} size={24} strokeWidth={2} />,
  },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const addSheetRef = React.useRef<BottomSheetModal>(null);

  return (
    <>
      <View
        className="flex-row border-t border-neutral-200 bg-white px-2 pt-2"
        style={{
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
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
                  onPress={() => {
                    if (pathname.startsWith('/budgets')) {
                      router.push('/budgets/create');
                      return;
                    }
                    addSheetRef.current?.present();
                  }}
                  className="size-12 items-center justify-center rounded-full bg-black"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  {tab.icon('#ffffff')}
                </Pressable>
              </View>
            );
          }

          const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
          const isActive = state.index === routeIndex;
          const iconColor = isActive ? '#000000' : '#A3A3A3';

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                if (routeIndex >= 0) {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: state.routes[routeIndex].key,
                    canPreventDefault: true,
                  });
                  if (!event.defaultPrevented) {
                    navigation.navigate(state.routes[routeIndex].name);
                  }
                }
              }}
              className="flex-1 items-center justify-center gap-[5px]"
            >
              {tab.icon(iconColor)}
              {isActive && (
                <View className="size-1 rounded-full bg-black" />
              )}
            </Pressable>
          );
        })}
      </View>
      <QuickAddSheet sheetRef={addSheetRef} />
    </>
  );
}
