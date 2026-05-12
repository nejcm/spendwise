import type { CurrencyKey } from '@/features/currencies';
import { format } from 'date-fns';
import * as React from 'react';
import { FormattedCurrency, Pressable, Text, View } from '@/components/ui';
import { TrendingDown, TrendingUp } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { expenseColor, incomeColor } from '@/lib/theme/colors';

type Props = {
  date: Date;
  income: number;
  expense: number;
  currency: CurrencyKey;
  onClose: () => void;
};

export function StatsCalendarDayTooltip({ date, income, expense, currency, onClose }: Props) {
  const net = income - expense;
  return (
    <Pressable onPress={onClose} className="mt-3">
      <View className="rounded-2xl bg-card p-4">
        <Text className="mb-2 text-sm font-medium">{format(date, 'EEEE, MMM d, yyyy')}</Text>

        <View className="flex-row items-center justify-between py-1">
          <View className="flex-row items-center gap-2">
            <TrendingUp size={14} color={incomeColor} />
            <Text className="text-sm text-muted-foreground">{translate('common.income')}</Text>
          </View>
          <FormattedCurrency value={income} currency={currency} className="text-sm font-medium" style={{ color: incomeColor }} />
        </View>

        <View className="flex-row items-center justify-between py-1">
          <View className="flex-row items-center gap-2">
            <TrendingDown size={14} color={expenseColor} />
            <Text className="text-sm text-muted-foreground">{translate('common.expenses')}</Text>
          </View>
          <FormattedCurrency value={expense} currency={currency} prefix="-" className="text-sm font-medium" style={{ color: expenseColor }} />
        </View>

        <View className="mt-1 flex-row items-center justify-between border-t border-muted pt-2">
          <Text className="text-sm text-muted-foreground">{translate('common.net')}</Text>
          <FormattedCurrency value={net} currency={currency} className="text-sm font-semibold" />
        </View>
      </View>
    </Pressable>
  );
}
