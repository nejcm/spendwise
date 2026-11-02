import type { AccountWithBalance } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { AmountText, Card, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { allocationByType } from '../helpers';
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS } from '../types';

export function NetWorthCard({ accounts }: { accounts: AccountWithBalance[] }) {
  const currency = useAppStore.use.currency();
  const total = accounts.reduce((sum, account) => sum + account.baseBalance, 0);
  const shares = React.useMemo(
    () => allocationByType(accounts).map(({ type, share }) => ({ type, share, label: `${ACCOUNT_TYPE_LABELS[type]} ${Math.round(share * 100)}%` })),
    [accounts],
  );

  return (
    <Card variant="hero" className="gap-3.5 p-5">
      <View className="gap-1">
        <Text className="text-sm text-muted-foreground">{translate('accounts.net_worth')}</Text>
        <AmountText size="hero" value={total} currency={currency} numberOfLines={1} adjustsFontSizeToFit />
      </View>
      {shares.length > 0 && (
        <>
          <View accessible accessibilityRole="image" accessibilityLabel={shares.map(({ label }) => label).join(', ')} className="h-2.5 flex-row gap-0.75 overflow-hidden rounded-full">
            {shares.map(({ type, share }) => (
              <View key={type} style={{ flex: share, minWidth: 4, backgroundColor: ACCOUNT_TYPE_COLORS[type] }} />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-x-4 gap-y-1">
            {shares.map(({ type, label }) => (
              <View key={type} className="flex-row items-center gap-1.5">
                <View className="size-2 rounded-full" style={{ backgroundColor: ACCOUNT_TYPE_COLORS[type] }} />
                <Text className="text-meta text-muted-foreground">{label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}
