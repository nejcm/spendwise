import type { TextProps } from 'react-native';
import type { CurrencyKey } from '@/features/currencies';
import type { NumberFormat } from '@/features/formatting/constants';
import * as React from 'react';
import { formatCurrency, formatDate, formatDateFull, formatNumber } from '@/features/formatting/helpers';
import { useAppStore } from '@/lib/store';
import { Text } from './text';

type BaseProps = Omit<TextProps, 'children'> & {
  className?: string;
};
export type DateProps = BaseProps & {
  value: number; // Unix seconds
  format?: string;
  full?: boolean;
};
export type NumberProps = BaseProps & {
  value: number | string;
  format?: NumberFormat;
  prefix?: string;
};
export type CurrencyProps = BaseProps & {
  value: number | string;
  format?: NumberFormat;
  currency: CurrencyKey;
  prefix?: string;
};

export function FormattedNumber({ value, format, prefix = '', ...textProps }: NumberProps) {
  const effectiveFormat = useAppStore.use.numberFormat();
  return (
    <Text {...textProps}>
      {prefix}
      {formatNumber(value, format ?? effectiveFormat)}
    </Text>
  );
}

export function FormattedCurrency({ value, format, currency, prefix = '', ...textProps }: CurrencyProps) {
  const effectiveFormat = useAppStore.use.numberFormat();
  const effectiveCurrencyFormat = useAppStore.use.currencyFormat();
  return (
    <Text {...textProps}>
      {prefix}
      {formatCurrency(value, currency, format ?? effectiveFormat, effectiveCurrencyFormat)}
    </Text>
  );
}

export function FormattedDate({ value, format, full = false, ...textProps }: DateProps) {
  const effectiveFormat = useAppStore.use.dateFormat();
  return <Text {...textProps}>{value ? (full ? formatDateFull(value, format ?? effectiveFormat) : formatDate(value, format ?? effectiveFormat)) : ''}</Text>;
}
