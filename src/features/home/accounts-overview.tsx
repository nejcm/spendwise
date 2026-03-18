import { format } from 'date-fns';
import { useRouter } from 'expo-router';

import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { formatCurrency } from '@/features/formatting/helpers';
import { useAccountsWithBalanceForMonth } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { NoDataCard } from '../../components/no-data-card';

export function AccountsOverview() {
  const router = useRouter();
  const currentMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const { data: accounts = [] } = useAccountsWithBalanceForMonth(currentMonth);
  const hasAccounts = accounts.length > 0;

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-medium">{translate('settings.accounts')}</Text>
        {hasAccounts && (
          <GhostButton size="sm" className="px-0" onPress={() => router.push('/accounts')}>
            <Text className="text-muted-foreground text-sm font-medium">{translate('common.seeAll')}</Text>
          </GhostButton>
        )}
      </View>

      {!hasAccounts
        ? (
            <NoDataCard onPress={() => router.push('/accounts')} label={translate('accounts.add')} />
          )
        : (
            <ScrollView
              style={defaultStyles.transparentBg}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row gap-2">
                {accounts.map((account) => {
                  return (
                    <Pressable
                      key={account.id}
                      onPress={() => router.push('/accounts')}
                      className="bg-card w-34 rounded-xl px-3 py-2"
                    >
                      <Text className="text-2xl">
                        {account.icon || '💵'}
                      </Text>
                      <Text
                        className="text-muted-foreground mt-2 text-xs font-medium"
                        numberOfLines={1}
                      >
                        {account.name}
                      </Text>
                      <Text className="mt-1 text-base font-medium">
                        {formatCurrency(account.balance, account.currency)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
    </View>
  );
}
