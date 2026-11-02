import type { TransactionWithCategory } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { DEFAULT_COLOR } from '@/components/color-selector';
import { Checkbox, FormattedCurrency, getPressedStyle, IconTile, Text } from '@/components/ui';
import { formatShortDate } from '@/features/formatting/helpers';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { transactionDisplayName } from '../helpers';
import { MerchantLogo } from './merchant-logo';

export type TransactionCardProps = {
  transaction: TransactionWithCategory;
  className?: string;
  /** For lists that aren't grouped by day. */
  showDate?: boolean;
  showAccount?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onStartSelection?: (id: string) => void;
};

export const TransactionCard = React.memo(({
  transaction,
  className,
  showDate = false,
  showAccount = false,
  selectionMode = false,
  selected = false,
  onSelect,
  onStartSelection,
}: TransactionCardProps) => {
  const router = useRouter();
  const isCompact = useAppStore.use.density() === 'compact';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isInflow = isIncome || (isTransfer && transaction.amount > 0);
  const isAdjustment = !!transaction.is_adjustment;
  const displayName = transactionDisplayName(transaction);
  const meta = [
    showDate && formatShortDate(transaction.date),
    isTransfer && !isAdjustment ? translate('transactions.transfer') : transaction.merchant_name && transaction.category_name,
    showAccount && transaction.account_name,
    transaction.note,
  ].filter(Boolean).join(' · ');
  const isForeign = transaction.currency !== transaction.baseCurrency;
  const logo = transaction.merchant_logo_slug ? <MerchantLogo slug={transaction.merchant_logo_slug} size={22} withBg={false} /> : null;
  const toggleSelection = React.useCallback(() => onSelect?.(transaction.id), [onSelect, transaction.id]);

  return (
    <Pressable
      className={cn('flex-row items-center gap-3', isCompact ? 'min-h-12 py-1' : 'min-h-15 py-2', selected && 'bg-accent-soft', className)}
      style={getPressedStyle}
      onPress={() => selectionMode ? toggleSelection() : router.push(`/transactions/${transaction.id}`)}
      onLongPress={() => selectionMode ? toggleSelection() : onStartSelection?.(transaction.id)}
      accessibilityRole={selectionMode ? 'checkbox' : 'button'}
      accessibilityState={selectionMode ? { checked: selected } : undefined}
      accessibilityLabel={selectionMode ? translate('transactions.select_transaction') : undefined}
    >
      {selectionMode && <Checkbox.Icon checked={selected} size="sm" />}
      <IconTile
        size={isCompact ? 'sm' : 'md'}
        color={transaction.category_color ?? DEFAULT_COLOR}
        icon={transaction.category_icon || (isTransfer ? '⇄' : '?')}
      >
        {logo}
      </IconTile>
      <View className="min-w-0 flex-1">
        <Text className="text-row font-medium" numberOfLines={1}>{displayName}</Text>
        {!!meta && <Text className="text-meta text-muted-foreground" numberOfLines={1}>{meta}</Text>}
      </View>
      <View className="items-end">
        <FormattedCurrency
          value={transaction.baseAmount}
          currency={transaction.baseCurrency}
          prefix={isInflow ? '+' : '-'}
          className={cn('text-row font-semibold', isIncome && 'text-positive', isTransfer && 'text-muted-foreground')}
        />
        {isForeign && <FormattedCurrency value={Math.abs(transaction.amount)} currency={transaction.currency} className="text-xs text-muted-foreground" />}
        {isTransfer && !isAdjustment && <Text className="text-xs text-muted-foreground">{translate('transactions.not_spending')}</Text>}
      </View>
    </Pressable>
  );
});
