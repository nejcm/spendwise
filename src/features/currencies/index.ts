export type Currency = {
  name: string;
  value: string;
  symbol: string;
};

export const CURRENCIES_MAP = {
  AUD: { name: 'Australian Dollar', value: 'AUD', symbol: '$' },
  GBP: { name: 'British Pound', value: 'GBP', symbol: '£' },
  CAD: { name: 'Canadian Dollar', value: 'CAD', symbol: '$' },
  CNY: { name: 'Chinese Yuan', value: 'CNY', symbol: '¥' },
  EUR: { name: 'Euro', value: 'EUR', symbol: '€' },
  INR: { name: 'Indian Rupee', value: 'INR', symbol: '₹' },
  JPY: { name: 'Japanese Yen', value: 'JPY', symbol: '¥' },
  MYR: { name: 'Malaysian Ringgit', value: 'MYR', symbol: 'RM' },
  PLN: { name: 'Polish Zloty ', value: 'PLN', symbol: 'zł' },
  KRW: { name: 'South Korean Won', value: 'KRW', symbol: '₩' },
  CHF: { name: 'Swiss Franc', value: 'CHF', symbol: 'CHF' },
  ZAR: { name: 'South African Rand', value: 'ZAR', symbol: 'R' },
  THB: { name: 'Thai Baht', value: 'THB', symbol: '฿' },
  USD: { name: 'US Dollar', value: 'USD', symbol: '$' },
} as const;
export type CurrencyKey = keyof typeof CURRENCIES_MAP;

export const CURRENCIES = Object.values(CURRENCIES_MAP);

export const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  ...currency,
  label: currency.value,
  subtext: currency.name,
}));

export const CURRENCY_VALUES = Object.keys(CURRENCIES_MAP) as CurrencyKey[];
