import type { TransactionWithCategory } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { DEFAULT_COLOR } from '@/components/color-selector';
import { Checkbox, FormattedCurrency, getPressedStyle, Text } from '@/components/ui';
import { formatShortDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { hexWithOpacity } from '@/lib/theme/colors';
import { MerchantLogo } from './merchant-logo';

export type TransactionCardProps = {
  transaction: TransactionWithCategory;
  className?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onStartSelection?: (id: string) => void;
};

export const TransactionCard = React.memo(({
  transaction,
  className,
  selectionMode = false,
  selected = false,
  onSelect,
  onStartSelection,
}: TransactionCardProps) => {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const density = useAppStore.use.density();
  const isCompact = density === 'compact';
  const isIncome = transaction.type === 'income';
  const displayName = transaction.merchant_name || transaction.category_name || 'Unknown';
  const showConverted = transaction.currency !== currency;
  const logo = transaction.merchant_logo_slug ? <MerchantLogo slug={transaction.merchant_logo_slug} /> : null;
  const toggleSelection = React.useCallback(() => onSelect?.(transaction.id), [onSelect, transaction.id]);

  return (
    <Pressable
      className={cn('flex-row items-center', isCompact ? 'gap-2 px-3 py-1.5' : 'gap-3 p-3', selected && 'bg-primary/10', className)}
      style={getPressedStyle}
      onPress={() => selectionMode ? toggleSelection() : router.push(`/transactions/${transaction.id}`)}
      onLongPress={() => selectionMode ? toggleSelection() : onStartSelection?.(transaction.id)}
      accessibilityRole={selectionMode ? 'checkbox' : 'button'}
      accessibilityState={selectionMode ? { checked: selected } : undefined}
      accessibilityLabel={selectionMode ? translate('transactions.select_transaction') : undefined}
    >
      {selectionMode && (
        <Checkbox.Icon checked={selected} size="sm" />
      )}
      {logo || (
        <View
          className="size-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: hexWithOpacity(transaction.category_color ?? DEFAULT_COLOR, 36) }}
        >
          <Text className="text-xl font-medium">
            {(transaction.category_icon || '?')}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-base font-medium" numberOfLines={1}>
          {displayName}
        </Text>
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
          {formatShortDate(transaction.date)}
          {transaction.merchant_name ? ` · ${transaction.category_name}` : ''}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </Text>
      </View>
      <View className="items-end">
        <FormattedCurrency
          value={transaction.amount}
          currency={transaction.currency}
          prefix={isIncome ? '+' : '-'}
          className={`text-base font-medium ${isIncome ? 'text-success-600' : ''}`}
        />
        {showConverted && (
          <FormattedCurrency value={transaction.baseAmount} currency={transaction.baseCurrency} className="text-sm text-muted-foreground" />
        )}
      </View>
    </Pressable>
  );
});
