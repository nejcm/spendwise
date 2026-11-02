import type { AccountWithBalance } from '@/features/accounts/types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { FormattedCurrency, getPressedStyle, IconTile, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS } from '../types';

export type AccountCardProps = {
  account: AccountWithBalance;
  monthDelta: number;
  onPress?: () => void;
};

export function AccountCard({ account, monthDelta, onPress }: AccountCardProps) {
  const currency = useAppStore.use.currency();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={getPressedStyle}
      className="flex-row items-center gap-3.5 rounded-card bg-card px-4.5 py-4"
    >
      <IconTile size="lg" icon={account.icon || '💵'} color={account.color ?? ACCOUNT_TYPE_COLORS[account.type]} />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold" numberOfLines={1}>{account.name}</Text>
        <Text className="text-meta text-muted-foreground" numberOfLines={1}>{`${ACCOUNT_TYPE_LABELS[account.type]} · ${account.currency}`}</Text>
      </View>
      <View className="shrink-0 items-end">
        <FormattedCurrency value={account.baseBalance} currency={currency} className="text-[17px] font-semibold" numberOfLines={1} />
        <Text className={cn('text-xs', monthDelta > 0 ? 'text-positive' : 'text-muted-foreground')} numberOfLines={1}>
          <FormattedCurrency value={monthDelta} currency={currency} prefix={monthDelta > 0 ? '+' : ''} />
          {` ${translate('accounts.this_month')}`}
        </Text>
      </View>
    </Pressable>
  );
}
