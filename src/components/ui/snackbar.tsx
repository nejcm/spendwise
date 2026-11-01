/* eslint-disable react-refresh/only-export-components */
import type { UniwindLucideIcon } from './icon';
import * as React from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { translate } from '@/lib/i18n';
import { getPressedStyle } from './button';
import { Check } from './icon';
import { NAV_BAR_HEIGHT, TAB_BAR_PADDING } from './nav-tab-bar';
import { Text } from './text';

type SnackbarOptions = {
  title: string;
  subtitle?: string;
  icon?: UniwindLucideIcon;
  undo?: () => void | Promise<void>;
  view?: () => void;
};

const AUTO_DISMISS_MS = 4000;
const GAP_ABOVE_TAB_BAR = 16;

const useSnackbarStore = create<{ snackbar?: SnackbarOptions & { id: number } }>(() => ({}));
let dismissTimer: ReturnType<typeof setTimeout> | undefined;
let nextId = 0;

export function showSnackbar(options: SnackbarOptions): void {
  clearTimeout(dismissTimer);
  nextId += 1;
  useSnackbarStore.setState({ snackbar: { ...options, id: nextId } });
  dismissTimer = setTimeout(hideSnackbar, AUTO_DISMISS_MS);
  AccessibilityInfo.announceForAccessibility(options.title);
}

export function hideSnackbar(): void {
  clearTimeout(dismissTimer);
  useSnackbarStore.setState({ snackbar: undefined });
}

function runAndHide(action: () => void | Promise<void>) {
  hideSnackbar();
  void action();
}

function SnackbarIcon({ icon: Icon = Check }: { icon?: UniwindLucideIcon }) {
  return <Icon colorClassName="accent-accent-foreground" size={16} strokeWidth={3} />;
}

export function SnackbarHost() {
  const snackbar = useSnackbarStore((state) => state.snackbar);
  const insets = useSafeAreaInsets();
  if (!snackbar) return null;

  const { id, title, subtitle, icon, undo, view } = snackbar;
  return (
    <Animated.View
      key={id}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={{ position: 'absolute', left: 16, right: 16, bottom: NAV_BAR_HEIGHT + Math.max(insets.bottom, TAB_BAR_PADDING) + GAP_ABOVE_TAB_BAR }}
    >
      <View className="flex-row items-center gap-3 rounded-card bg-fab py-3 pr-2 pl-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
        <View className="size-8 items-center justify-center rounded-full bg-accent">
          <SnackbarIcon icon={icon} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-row font-semibold text-fab-foreground">{title}</Text>
          {!!subtitle && (
            <Text numberOfLines={1} className="text-meta text-fab-foreground opacity-75">{subtitle}</Text>
          )}
        </View>
        {undo && (
          <Pressable
            accessibilityRole="button"
            onPress={() => runAndHide(undo)}
            style={getPressedStyle}
            className="h-10 justify-center rounded-full px-3"
          >
            <Text className="text-row font-semibold text-fab-foreground">{translate('common.undo')}</Text>
          </Pressable>
        )}
        {view && (
          <Pressable
            accessibilityRole="button"
            onPress={() => runAndHide(view)}
            style={getPressedStyle}
            className="h-10 justify-center rounded-full bg-fab-foreground px-3.5"
          >
            <Text className="text-row font-semibold text-fab">{translate('common.view')}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
