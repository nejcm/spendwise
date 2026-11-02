import type { TextProps } from 'react-native';
import type { CurrencyKey } from '@/features/currencies';
import type { NumberFormat } from '@/features/formatting/constants';
import * as React from 'react';
import { formatCurrency, formatDate, formatDateFull, formatInstant, formatInstantFull, formatNumber, splitFraction } from '@/features/formatting/helpers';
import { tv } from '@/lib/cn';
import { useAppStore } from '@/lib/store/store';
import { Text } from './text';

type BaseProps = Omit<TextProps, 'children'> & {
  className?: string;
};
export type DateProps = BaseProps & {
  value: number; // Unix seconds
  format?: string;
  full?: boolean;
  /** Treat `value` as a real timestamp (local time) instead of a UTC-midnight calendar date. */
  instant?: boolean;
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
  shorten?: boolean | number;
  negativeSymbol?: boolean;
  fractionDigits?: number;
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

export function FormattedCurrency({ value, format, currency, prefix = '', shorten = false, negativeSymbol = true, fractionDigits = 2, className, ...textProps }: CurrencyProps) {
  const effectiveFormat = useAppStore.use.numberFormat();
  const effectiveCurrencyFormat = useAppStore.use.currencyFormat();
  return (
    <Text {...textProps} className={`tabular-nums ${className ?? ''}`}>
      {prefix}
      {formatCurrency(value, currency, { numberFormat: format ?? effectiveFormat, currencyFormat: effectiveCurrencyFormat, shorten, negativeSymbol, fractionDigits })}
    </Text>
  );
}

const amountText = tv({
  slots: {
    base: 'tabular-nums',
    cents: 'tabular-nums',
  },
  variants: {
    size: {
      hero: { base: 'text-hero font-bold tracking-hero', cents: 'text-[22px] font-medium tracking-normal text-muted-foreground' },
      row: { base: 'text-row font-semibold' },
    },
  },
  defaultVariants: { size: 'row' },
});

export type AmountTextProps = Omit<CurrencyProps, 'format'> & {
  /** `hero` renders the fraction smaller and muted ("€7,400" + ".75"), shrinks to fit one line and is never shortened. */
  size?: 'hero' | 'row';
  centsClassName?: string;
};

export function AmountText({ value, currency, prefix = '', shorten = false, negativeSymbol = true, fractionDigits = 2, size = 'row', className, centsClassName, ...textProps }: AmountTextProps) {
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const styles = amountText({ size });
  const formatted = prefix + formatCurrency(value, currency, { numberFormat, currencyFormat, shorten: size === 'row' && shorten, negativeSymbol, fractionDigits });

  if (size === 'row') {
    return <Text {...textProps} className={styles.base({ className })}>{formatted}</Text>;
  }
  const [whole, fraction, suffix] = splitFraction(formatted, numberFormat);
  return (
    <Text numberOfLines={1} adjustsFontSizeToFit {...textProps} className={styles.base({ className })}>
      {whole}
      {!!fraction && <Text className={styles.cents({ className: centsClassName })}>{fraction}</Text>}
      {suffix}
    </Text>
  );
}

export function FormattedDate({ value, format, full = false, instant = false, ...textProps }: DateProps) {
  const effectiveFormat = useAppStore.use.dateFormat();
  const formatter = instant
    ? (full ? formatInstantFull : formatInstant)
    : (full ? formatDateFull : formatDate);
  return <Text {...textProps}>{value ? formatter(value, format ?? effectiveFormat) : ''}</Text>;
}
