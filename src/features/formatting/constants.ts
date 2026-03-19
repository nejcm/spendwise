export const CURRENCY_FORMAT_OPTIONS = [
  'symbol-after', // 1,234.56$
  'symbol-before', // $1,234.56
  'code-after', // 1,234.56 USD
  'code-before', // USD 1,234.56
] as const;
export type CurrencyFormat = (typeof CURRENCY_FORMAT_OPTIONS)[number];

export const NUMBER_FORMAT_OPTIONS = [
  'stop', // 1234.56
  'stop-space', // 1,234.56
  'comma', // 1234,56
  'comma-space', // 1.234,56
] as const;
export type NumberFormat = (typeof NUMBER_FORMAT_OPTIONS)[number];

export const DATE_FORMAT_OPTIONS = [
  'dd/MM/yyyy', // 12/03/2026
  'MM/dd/yyyy', // 03/12/2026
  'yyyy-MM-dd', // 2026-03-12
  'dd.MM.yyyy', // 12.03.2026
  'MM.dd.yyyy', // 03.12.2026
  'dd MMMM, yyyy', // 12 March, 2026
  'MMMM dd, yyyy', // March 12, 2026
  'MMM d, yyyy', // Mar 12, 2026
] as const;
export type DateFormat = (typeof DATE_FORMAT_OPTIONS)[number];
