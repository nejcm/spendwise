import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';

import { BellIcon, Home, PlusIcon, Receipt, UserIcon } from '@/components/ui/icons';

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
    name: 'transactions',
    icon: (color) => <Receipt color={color} size={24} strokeWidth={2} />,
  },
  {
    name: '__add__',
    icon: () => <PlusIcon />,
  },
  {
    name: 'budgets',
    icon: (color) => <BellIcon color={color} size={24} strokeWidth={2} />,
  },
  {
    name: 'settings',
    icon: (color) => <UserIcon color={color} size={24} strokeWidth={2} />,
  },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        paddingTop: 12,
        paddingHorizontal: 8,
        borderTopWidth: 0,
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
            <View key="add" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Pressable
                onPress={() => router.push('/transactions/create' as never)}
                style={({ pressed }) => ({
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#000000',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <PlusIcon />
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
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {tab.icon(iconColor)}
            {isActive && (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#000000',
                }}
              />
            )}
            {!isActive && <View style={{ width: 4, height: 4 }} />}
          </Pressable>
        );
      })}
    </View>
  );
}
