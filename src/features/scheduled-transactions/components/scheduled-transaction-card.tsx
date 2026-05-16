import type { ScheduledTransactionWithDetails } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { FormattedCurrency, PauseIcon, Text } from '@/components/ui';
import { formatDateFull } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

export default function ScheduledTransactionCard({
  item,
}: {
  item: ScheduledTransactionWithDetails;
}) {
  const router = useRouter();
  const density = useAppStore.use.density();
  const isCompact = density === 'compact';
  return (
    <Pressable
      key={item.id}
      className={`rounded-xl bg-card ${isCompact ? 'mb-2 p-2.5' : 'mb-3 p-4'} ${!item.is_active ? 'opacity-60' : ''}`}
      onPress={() => router.push(`/scheduled/${item.id}`)}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-2">
          <Text className="text-lg font-medium">{item.note ?? '/'}</Text>
          {!item.is_active && (
            <View
              className="flex-row items-center justify-center gap-1 rounded-full bg-yellow-600/20 px-2 py-1"
              aria-label="Inactive"
            >
              <PauseIcon
                colorClassName="accent-yellow-600 dark:accent-yellow-500"
                size={12}
              />
              <Text className="text-xs text-yellow-600">
                {translate('common.paused')}
              </Text>
            </View>
          )}
        </View>
        <FormattedCurrency
          value={item.amount}
          currency={item.currency}
          prefix={item.type === 'income' ? '+' : '-'}
          className={`text-right text-lg font-semibold ${item.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}
        />
      </View>
      <Text className="text-sm text-muted-foreground">
        {item.category_icon
          ? `${item.category_icon} ${item.category_name}`
          : translate('common.none')}
        {' '}
        ·
        {' '}
        {`${item.account_icon} ${item.account_name}`}
      </Text>
      <Text className="text-sm text-muted-foreground">
        {translate(`scheduled.frequencyOptions.${item.frequency}`)}
        {' '}
        ·
        {' '}
        {translate('common.next_on', {
          date: formatDateFull(item.next_due_date),
        })}
      </Text>
    </Pressable>
  );
}
