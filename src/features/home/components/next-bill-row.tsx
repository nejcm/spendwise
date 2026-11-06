import type { NextBill } from '../helpers';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { AmountText, getPressedStyle, IconTile, SectionHeader, Text } from '@/components/ui';
import { SHORTEN_ROW } from '@/features/formatting/constants';
import { cn } from '@/lib/cn';
import { monthOfDay } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { monthName } from '../helpers';

function dueLabel(daysUntil: number) {
  if (daysUntil === 0) return translate('home.next_bill.today');
  if (daysUntil === 1) return translate('home.next_bill.tomorrow');
  return translate('home.next_bill.in_days', { count: daysUntil });
}

export function NextBillRow({ bill }: { bill: NextBill }) {
  const router = useRouter();
  const { rule, daysUntil, moreInMonth } = bill;
  const isCompact = useAppStore.use.density() === 'compact';

  return (
    <View>
      <SectionHeader title={translate('home.upcoming')} onSeeAll={() => router.push('/scheduled')} className="px-0 pt-6 pb-1" titleClassName="text-header-title font-semibold text-foreground" />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/scheduled')}
        style={getPressedStyle}
        className={cn('flex-row items-center gap-3', isCompact ? 'min-h-12 py-1' : 'min-h-15 py-2')}
      >
        <IconTile size={isCompact ? 'sm' : 'md'} icon={rule.category_icon} color={rule.category_color} />
        <View className="min-w-0 flex-1">
          <Text className="text-row font-medium" numberOfLines={1}>{rule.note || rule.category_name}</Text>
          <Text className={cn('text-meta', daysUntil <= 1 ? 'text-warning-700 dark:text-warning-400' : 'text-muted-foreground')} numberOfLines={1}>
            {translate('home.next_bill.due', { when: dueLabel(daysUntil) })}
          </Text>
        </View>
        <View className="items-end">
          <AmountText value={rule.amount} currency={rule.currency} prefix="-" shorten={SHORTEN_ROW} className="text-row font-medium text-muted-foreground" />
          {moreInMonth > 0 && (
            <Text className="text-xs text-muted-foreground">
              {translate('home.next_bill.more', { count: moreInMonth, month: monthName(monthOfDay(rule.next_due_date).month - 1) })}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}
