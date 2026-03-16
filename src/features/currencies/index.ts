export type Currency = {
  name: string;
  value: string;
  symbol: string;
  image: string;
};

export const CURRENCIES_MAP = {
  AUD: { name: 'Australian Dollar', value: 'AUD', symbol: '$', image: require('../../../assets/flags/au.svg') },
  GBP: { name: 'British Pound', value: 'GBP', symbol: '£', image: require('../../../assets/flags/gb.svg') },
  CAD: { name: 'Canadian Dollar', value: 'CAD', symbol: '$', image: require('../../../assets/flags/ca.svg') },
  CNY: { name: 'Chinese Yuan', value: 'CNY', symbol: '¥', image: require('../../../assets/flags/cn.svg') },
  EUR: { name: 'Euro', value: 'EUR', symbol: '€', image: require('../../../assets/flags/eu.svg') },
  INR: { name: 'Indian Rupee', value: 'INR', symbol: '₹', image: require('../../../assets/flags/in.svg') },
  JPY: { name: 'Japanese Yen', value: 'JPY', symbol: '¥', image: require('../../../assets/flags/jp.svg') },
  MYR: { name: 'Malaysian Ringgit', value: 'MYR', symbol: 'RM', image: require('../../../assets/flags/my.svg') },
  PLN: { name: 'Polish Zloty ', value: 'PLN', symbol: 'zł', image: require('../../../assets/flags/pl.svg') },
  KRW: { name: 'South Korean Won', value: 'KRW', symbol: '₩', image: require('../../../assets/flags/kr.svg') },
  CHF: { name: 'Swiss Franc', value: 'CHF', symbol: 'CHF', image: require('../../../assets/flags/ch.svg') },
  ZAR: { name: 'South African Rand', value: 'ZAR', symbol: 'R', image: require('../../../assets/flags/za.svg') },
  THB: { name: 'Thai Baht', value: 'THB', symbol: '฿', image: require('../../../assets/flags/th.svg') },
  USD: { name: 'US Dollar', value: 'USD', symbol: '$', image: require('../../../assets/flags/us.svg') },
} as const;
export type CurrencyKey = keyof typeof CURRENCIES_MAP;

export const CURRENCIES = Object.values(CURRENCIES_MAP);

export const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  ...currency,
  label: currency.value,
  subtext: currency.name,
}));

export const CURRENCY_VALUES = Object.keys(CURRENCIES) as CurrencyKey[];
