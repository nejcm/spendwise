import type { Href } from 'expo-router';
import type { UniwindLucideIcon } from '@/components/ui/icon';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { PressableScale, Text } from '@/components/ui';
import { ArrowLeftRight, Calendar, Plus, ScanLine } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { triggerScanPicker } from '@/lib/store/local-store';

type QuickAction = {
  key: 'add' | 'transfer' | 'scan' | 'bills';
  Icon: UniwindLucideIcon;
  href?: Href;
};

const ACTIONS: QuickAction[] = [
  { key: 'add', Icon: Plus, href: '/transactions/new' },
  { key: 'transfer', Icon: ArrowLeftRight, href: { pathname: '/transactions/new', params: { type: 'transfer' } } },
  { key: 'scan', Icon: ScanLine },
  { key: 'bills', Icon: Calendar, href: '/scheduled' },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View className="flex-row gap-2.5 py-4">
      {ACTIONS.map(({ key, Icon, href }) => {
        const isPrimary = key === 'add';
        return (
          <PressableScale
            key={key}
            accessibilityRole="button"
            onPress={() => (href ? router.push(href) : triggerScanPicker())}
            className="flex-1 items-center gap-2"
          >
            <View className={cn('size-15 items-center justify-center rounded-card', isPrimary ? 'bg-primary' : 'border border-edge bg-card')}>
              <Icon size={28} strokeWidth={isPrimary ? 2 : 1.8} colorClassName={isPrimary ? 'accent-primary-foreground' : 'accent-foreground'} />
            </View>
            <Text className="text-meta text-foreground-2" numberOfLines={1}>{translate(`home.actions.${key}`)}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
