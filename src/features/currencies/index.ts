export type Currency = {
  name: string;
  value: string;
  symbol: string;
  image: string;
};

export const CURRENCIES_MAP = {
  AUD: { name: 'Australian Dollar', value: 'AUD', symbol: '$', image: require('../../../assets/flags/au.jpg') },
  GBP: { name: 'British Pound', value: 'GBP', symbol: '£', image: require('../../../assets/flags/gb.jpg') },
  CAD: { name: 'Canadian Dollar', value: 'CAD', symbol: '$', image: require('../../../assets/flags/ca.jpg') },
  CNY: { name: 'Chinese Yuan', value: 'CNY', symbol: '¥', image: require('../../../assets/flags/cn.jpg') },
  EUR: { name: 'Euro', value: 'EUR', symbol: '€', image: require('../../../assets/flags/eu.jpg') },
  INR: { name: 'Indian Rupee', value: 'INR', symbol: '₹', image: require('../../../assets/flags/in.jpg') },
  JPY: { name: 'Japanese Yen', value: 'JPY', symbol: '¥', image: require('../../../assets/flags/jp.jpg') },
  MYR: { name: 'Malaysian Ringgit', value: 'MYR', symbol: 'RM', image: require('../../../assets/flags/my.jpg') },
  PLN: { name: 'Polish Zloty ', value: 'PLN', symbol: 'zł', image: require('../../../assets/flags/pl.jpg') },
  KRW: { name: 'South Korean Won', value: 'KRW', symbol: '₩', image: require('../../../assets/flags/kr.jpg') },
  CHF: { name: 'Swiss Franc', value: 'CHF', symbol: 'CHF', image: require('../../../assets/flags/ch.jpg') },
  ZAR: { name: 'South African Rand', value: 'ZAR', symbol: 'R', image: require('../../../assets/flags/za.jpg') },
  THB: { name: 'Thai Baht', value: 'THB', symbol: '฿', image: require('../../../assets/flags/th.jpg') },
  USD: { name: 'US Dollar', value: 'USD', symbol: '$', image: require('../../../assets/flags/us.jpg') },
} as const;
export type CurrencyKey = keyof typeof CURRENCIES_MAP;

export const CURRENCIES = Object.values(CURRENCIES_MAP);

export const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  ...currency,
  label: currency.value,
  subtext: currency.name,
}));

export const CURRENCY_VALUES = Object.keys(CURRENCIES_MAP) as CurrencyKey[];
