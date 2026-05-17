import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { FormattedCurrency, getPressedStyle, Text } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { SkeletonGrid } from '@/components/ui/skeleton';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { NoDataCard } from '../../components/no-data-card';
import { useAccountsWithBalanceForRange } from '../accounts/hooks';

export const AccountsOverview = React.memo(() => {
  const router = useRouter();
  const currentMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [startDate, endDate] = React.useMemo(() => getCurrentMonthRange(currentMonth), [currentMonth]);
  const { data: accounts = [], isLoading } = useAccountsWithBalanceForRange(startDate, endDate);
  const density = useAppStore.use.density();
  const isCompact = density === 'compact';
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
      {hasAccounts
        ? (
            <ScrollView style={defaultStyles.transparentBg} horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {accounts.map((account) => {
                  return (
                    <Pressable
                      key={account.id}
                      onPress={() => router.push(`/accounts/${account.id}`)}
                      className={cn('rounded-xl bg-card', isCompact ? 'w-38 px-2.5 py-1.5' : 'w-34 px-3 py-2')}
                      style={getPressedStyle}
                    >
                      <View className={`gap-2 ${isCompact ? 'flex-row items-center' : ''}`}>
                        <Text className={isCompact ? 'text-xl' : 'text-2xl'}>
                          {account.icon || '💵'}
                        </Text>
                        <Text
                          className="text-xs font-medium text-muted-foreground"
                          numberOfLines={isCompact ? 2 : 1}
                        >
                          {account.name}
                        </Text>
                      </View>
                      <FormattedCurrency value={account.baseBalance} currency={account.baseCurrency} className="my-1 text-base font-medium" />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )
        : isLoading
          ? (
              <View className="gap-2">
                <SkeletonGrid rows={1} cols={2} />
              </View>
            )
          : <NoDataCard onPress={() => router.push('/accounts')} label={translate('accounts.add')} />}
    </View>
  );
});
