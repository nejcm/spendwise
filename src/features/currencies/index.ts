export type Currency = {
  name: string;
  value: string;
  symbol: string;
  image: string;
};

export const CURRENCIES = [
  { name: 'Australian Dollar', value: 'AUD', symbol: '$', image: require('../../../assets/flags/au.svg') },
  { name: 'British Pound', value: 'GBP', symbol: '£', image: require('../../../assets/flags/gb.svg') },
  { name: 'Canadian Dollar', value: 'CAD', symbol: '$', image: require('../../../assets/flags/ca.svg') },
  { name: 'Chinese Yuan', value: 'CNY', symbol: '¥', image: require('../../../assets/flags/cn.svg') },
  { name: 'Euro', value: 'EUR', symbol: '€', image: require('../../../assets/flags/eu.svg') },
  { name: 'Indian Rupee', value: 'INR', symbol: '₹', image: require('../../../assets/flags/in.svg') },
  { name: 'Japanese Yen', value: 'JPY', symbol: '¥', image: require('../../../assets/flags/jp.svg') },
  { name: 'Malaysian Ringgit', value: 'MYR', symbol: 'RM', image: require('../../../assets/flags/my.svg') },
  { name: 'Polish Zloty ', value: 'PLN', symbol: 'zł', image: require('../../../assets/flags/pl.svg') },
  { name: 'South Korean Won', value: 'KRW', symbol: '₩', image: require('../../../assets/flags/kr.svg') },
  { name: 'Swiss Franc', value: 'CHF', symbol: 'CHF', image: require('../../../assets/flags/ch.svg') },
  { name: 'South African Rand', value: 'ZAR', symbol: 'R', image: require('../../../assets/flags/za.svg') },
  { name: 'Thai Baht', value: 'THB', symbol: '฿', image: require('../../../assets/flags/th.svg') },
  { name: 'US Dollar', value: 'USD', symbol: '$', image: require('../../../assets/flags/us.svg') },
] as const;

export type CurrencyKey = (typeof CURRENCIES)[number]['value'];
