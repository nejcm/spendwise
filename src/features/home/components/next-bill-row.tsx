import type { NextBill } from '../helpers';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { AmountText, getPressedStyle, IconTile, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { monthName } from '../helpers';

function dueLabel(daysUntil: number) {
  if (daysUntil === 0) return translate('home.next_bill.today');
  if (daysUntil === 1) return translate('home.next_bill.tomorrow');
  return translate('home.next_bill.in_days', { count: daysUntil });
}

export function NextBillRow({ bill }: { bill: NextBill }) {
  const router = useRouter();
  const { rule, daysUntil, moreInMonth } = bill;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/scheduled')}
      style={getPressedStyle}
      className="mt-2.5 flex-row items-center gap-3 rounded-card bg-card py-3 pr-4 pl-3"
    >
      <IconTile size="sm" icon={rule.category_icon} color={rule.category_color} />
      <View className="min-w-0 flex-1">
        <Text className="text-meta text-muted-foreground" numberOfLines={1}>{translate('home.next_bill.label', { when: dueLabel(daysUntil) })}</Text>
        <Text className="text-row font-semibold" numberOfLines={1}>{rule.note || rule.category_name}</Text>
      </View>
      <View className="items-end">
        <AmountText value={rule.amount} currency={rule.currency} prefix="-" />
        {moreInMonth > 0 && (
          <Text className="text-xs text-muted-foreground">
            {translate('home.next_bill.more', { count: moreInMonth, month: monthName(new Date(rule.next_due_date * 1000).getUTCMonth()) })}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
