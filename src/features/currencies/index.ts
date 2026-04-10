export type Currency = {
  name: string;
  value: string;
  symbol: string;
};

export const CURRENCIES_MAP = {
  AUD: { name: 'Australian Dollar', value: 'AUD', symbol: '$' },
  BRL: { name: 'Brazilian Real', value: 'BRL', symbol: 'R$' },
  GBP: { name: 'British Pound', value: 'GBP', symbol: '£' },
  CAD: { name: 'Canadian Dollar', value: 'CAD', symbol: '$' },
  CNY: { name: 'Chinese Yuan', value: 'CNY', symbol: '¥' },
  CZK: { name: 'Czech Koruna', value: 'CZK', symbol: 'Kč' },
  DKK: { name: 'Danish Krone', value: 'DKK', symbol: 'kr' },
  EUR: { name: 'Euro', value: 'EUR', symbol: '€' },
  HKD: { name: 'Hong Kong Dollar', value: 'HKD', symbol: 'HK$' },
  HUF: { name: 'Hungarian Forint', value: 'HUF', symbol: 'Ft' },
  ISK: { name: 'Icelandic Króna', value: 'ISK', symbol: 'kr' },
  IDR: { name: 'Indonesian Rupiah', value: 'IDR', symbol: 'Rp' },
  INR: { name: 'Indian Rupee', value: 'INR', symbol: '₹' },
  ILS: { name: 'Israeli Shekel', value: 'ILS', symbol: '₪' },
  JPY: { name: 'Japanese Yen', value: 'JPY', symbol: '¥' },
  KRW: { name: 'South Korean Won', value: 'KRW', symbol: '₩' },
  MYR: { name: 'Malaysian Ringgit', value: 'MYR', symbol: 'RM' },
  MXN: { name: 'Mexican Peso', value: 'MXN', symbol: '$' },
  NZD: { name: 'New Zealand Dollar', value: 'NZD', symbol: '$' },
  NOK: { name: 'Norwegian Krone', value: 'NOK', symbol: 'kr' },
  PHP: { name: 'Philippine Peso', value: 'PHP', symbol: '₱' },
  PLN: { name: 'Polish Zloty', value: 'PLN', symbol: 'zł' },
  RON: { name: 'Romanian Leu', value: 'RON', symbol: 'lei' },
  SGD: { name: 'Singapore Dollar', value: 'SGD', symbol: 'S$' },
  ZAR: { name: 'South African Rand', value: 'ZAR', symbol: 'R' },
  SEK: { name: 'Swedish Krona', value: 'SEK', symbol: 'kr' },
  CHF: { name: 'Swiss Franc', value: 'CHF', symbol: 'CHF' },
  THB: { name: 'Thai Baht', value: 'THB', symbol: '฿' },
  TRY: { name: 'Turkish Lira', value: 'TRY', symbol: '₺' },
  USD: { name: 'US Dollar', value: 'USD', symbol: '$' },
} as const;
export type CurrencyKey = keyof typeof CURRENCIES_MAP;

export const CURRENCIES = Object.values(CURRENCIES_MAP);

export const CURRENCY_VALUES = Object.keys(CURRENCIES_MAP) as CurrencyKey[];
