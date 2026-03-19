import { format } from 'date-fns';
import { useRouter } from 'expo-router';

import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { FormattedCurrency, Text } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { NoDataCard } from '../../components/no-data-card';
import { useAccountsWithBalanceForRange } from '../accounts/hooks';

export function AccountsOverview() {
  const router = useRouter();
  const currentMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [startDate, endDate] = React.useMemo(() => getCurrentMonthRange(currentMonth), [currentMonth]);
  const { data: accounts = [] } = useAccountsWithBalanceForRange(startDate, endDate);
  const hasAccounts = accounts.length > 0;

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-medium">{translate('settings.accounts')}</Text>
        {hasAccounts && (
          <GhostButton size="sm" className="px-0" onPress={() => router.push('/accounts')}>
            <Text className="text-sm font-medium text-muted-foreground">{translate('common.seeAll')}</Text>
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
                      className="w-34 rounded-xl bg-card px-3 py-2"
                    >
                      <Text className="text-2xl">
                        {account.icon || '💵'}
                      </Text>
                      <Text
                        className="mt-2 text-xs font-medium text-muted-foreground"
                        numberOfLines={1}
                      >
                        {account.name}
                      </Text>
                      <FormattedCurrency value={account.baseBalance} currency={account.baseCurrency} className="my-1 text-base font-medium" />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
    </View>
  );
}
