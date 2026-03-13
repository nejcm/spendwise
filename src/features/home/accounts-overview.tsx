import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';
import { useAccountsWithBalanceForMonth } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';

export function AccountsOverview() {
  const router = useRouter();
  const currentMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const { data: accounts = [] } = useAccountsWithBalanceForMonth(currentMonth);

  return (
    <View>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-medium">{translate('settings.accounts')}</Text>
        <Pressable onPress={() => router.push('/accounts')}>
          <Text className="text-sm font-medium text-muted-foreground">{translate('common.seeAll')}</Text>
        </Pressable>
      </View>

      {accounts.length === 0
        ? (
            <Pressable
              onPress={() => router.push('/accounts')}
              className="rounded-2xl border-2 border-dashed border-gray-300 bg-card px-4 py-5 dark:border-gray-700"
            >
              <View className="flex-row items-center">
                <Plus className="mr-2 size-5 text-foreground" />
                <Text className="text-sm font-medium text-foreground">
                  {translate('accounts.add')}
                </Text>
              </View>
            </Pressable>
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
