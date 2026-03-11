export const CURRENCY_FORMAT_OPTIONS = [
  'symbol-after', // 1,234.56$
  'symbol-before', // $1,234.56
  'code-after', // 1,234.56 USD
  'code-before', // USD 1,234.56
] as const;
export type CurrencyFormat = (typeof CURRENCY_FORMAT_OPTIONS)[number];

export const NUMBER_FORMAT_OPTIONS = [
  'stop', // 1,234.56
  'stop-space', // 1 234.56
  'comma', // 1.234,56
  'comma-space', // 1 234,56
] as const;
export type NumberFormat = (typeof NUMBER_FORMAT_OPTIONS)[number];

export const DATE_FORMAT_OPTIONS = [
  'DD/MM/YYYY', // 12/03/2026
  'MM/DD/YYYY', // 03/12/2026
  'YYYY-MM-DD', // 2026-03-12
  'DD.MM.YYYY', // 12.03.2026
  'MM.DD.YYYY', // 03.12.2026
  'DD MMMM, YYYY', // 12 March, 2026
  'MMMM DD, YYYY', // March 12, 2026
] as const;
export type DateFormat = (typeof DATE_FORMAT_OPTIONS)[number];
