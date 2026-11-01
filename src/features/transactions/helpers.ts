import type { Transaction, TransactionType, TransactionWithCategory } from './types';
import type { CurrencyKey } from '@/features/currencies';
import type { CurrencyFormat, NumberFormat } from '@/features/formatting/constants';
import { amountToCents, formatCurrency, formatInstantFull } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';

type DisplayNameFields = Pick<TransactionWithCategory, 'is_adjustment' | 'counter_account_name' | 'amount' | 'merchant_name' | 'category_name' | 'type'>;

export function transactionDisplayName(t: DisplayNameFields): string {
  if (t.is_adjustment) return translate('accounts.opening_balance');
  if (t.counter_account_name) {
    return translate(t.amount < 0 ? 'transactions.transfer_to' : 'transactions.transfer_from', { account: t.counter_account_name });
  }
  return t.merchant_name || t.category_name || translate(t.type === 'transfer' ? 'transactions.transfer' : 'transactions.unknown');
}

/** Display-only: one unit of `currency` in `baseCurrency`, derived from the stored amounts so corrections stay consistent. */
export function deriveFxRate(t: Pick<Transaction, 'amount' | 'baseAmount' | 'currency' | 'baseCurrency'>): number | null {
  if (t.currency === t.baseCurrency || t.amount === 0) return null;
  return Math.abs(t.baseAmount) / Math.abs(t.amount);
}

export function fxRateText(
  t: Pick<Transaction, 'amount' | 'baseAmount' | 'currency' | 'baseCurrency'>,
  format: { numberFormat: NumberFormat; currencyFormat: CurrencyFormat },
): string | null {
  const rate = deriveFxRate(t);
  if (rate === null) return null;
  const one = formatCurrency(100, t.currency, { ...format, fractionDigits: 0 });
  return `${one} = ${formatCurrency(rate * 100, t.baseCurrency, { ...format, fractionDigits: 4 })}`;
}

const FOOTER_DATE_FORMAT = 'MMM d, HH:mm';

export function transactionFooterText(t: Pick<Transaction, 'created_at' | 'updated_at'>, fromRule: boolean): string {
  const date = formatInstantFull(t.created_at, FOOTER_DATE_FORMAT);
  if (fromRule) return translate('transactions.detail.added_by_rule', { date });
  if (t.updated_at <= t.created_at) return translate('transactions.detail.never_edited', { date });
  return translate('transactions.detail.edited', { date, edited: formatInstantFull(t.updated_at, FOOTER_DATE_FORMAT) });
}

/** The first `limit` tiles, with a selection from further down the list moved to the front so it stays visible. */
export function categoryTiles<T extends { id: string }>(categories: T[], selectedId: string, limit: number): T[] {
  const tiles = categories.slice(0, limit);
  const selected = categories.find((c) => c.id === selectedId);
  return !selected || tiles.includes(selected) ? tiles : [selected, ...tiles.slice(0, limit - 1)];
}

export function savedSnackbar({ type, amount, currency, format, label, onUndo, onView }: {
  type: TransactionType;
  /** As entered in the form: major units, unsigned. */
  amount: string;
  currency: CurrencyKey;
  format: { numberFormat: NumberFormat; currencyFormat: CurrencyFormat };
  label?: string | null;
  onUndo: () => void;
  onView: () => void;
}) {
  const sign = type === 'income' ? '+' : type === 'expense' ? '-' : '';
  return {
    title: translate(`transactions.saved.${type}`),
    subtitle: [`${sign}${formatCurrency(amountToCents(toNumber(amount) ?? 0), currency, format)}`, label].filter(Boolean).join(' · '),
    undo: onUndo,
    view: onView,
  };
}
