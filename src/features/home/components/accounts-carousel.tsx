import type { AccountWithBalance } from '@/features/accounts/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DEFAULT_COLOR } from '@/components/color-selector';
import { FormattedCurrency, getPressedStyle, IconTile, SectionHeader, Text } from '@/components/ui';
import { useAccountNetChanges } from '@/features/accounts/api';
import { cn } from '@/lib/cn';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';

export function AccountsCarousel({ accounts }: { accounts: AccountWithBalance[] }) {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const isCompact = useAppStore.use.density() === 'compact';
  const [startDate, endDate] = getCurrentMonthRange(useCurrentYearMonth());
  const { data: netChanges = {} } = useAccountNetChanges(startDate, endDate);

  return (
    <View>
      <SectionHeader title={translate('settings.accounts')} onSeeAll={() => router.push('/accounts')} className="px-0 pt-5.5 pb-2.5" titleClassName="text-header-title font-semibold text-foreground" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={defaultStyles.transparentBg} className="-mr-5" contentContainerClassName="gap-2.5 pr-5">
        {accounts.map((account) => {
          const net = netChanges[account.id] ?? 0;
          return (
            <Pressable
              key={account.id}
              accessibilityRole="button"
              onPress={() => router.push(`/accounts/${account.id}`)}
              style={getPressedStyle}
              className={cn('w-38 rounded-card bg-card', isCompact ? 'gap-1.5 p-3' : 'gap-2 p-4')}
            >
              <View className={cn(isCompact && 'flex-row items-center gap-2')}>
                <IconTile icon={account.icon || '💵'} color={account.color ?? DEFAULT_COLOR} className={isCompact ? 'size-7 rounded-lg' : 'size-9 rounded-[11px]'} />
                {isCompact && <Text className="shrink text-meta text-muted-foreground" numberOfLines={1}>{account.name}</Text>}
              </View>
              <View>
                {!isCompact && <Text className="text-meta text-muted-foreground" numberOfLines={1}>{account.name}</Text>}
                <FormattedCurrency value={net} prefix={net > 0 ? '+' : ''} currency={currency} className={cn('text-header-title font-medium', net > 0 && 'text-positive')} numberOfLines={1} adjustsFontSizeToFit />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
