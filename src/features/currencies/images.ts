import type { CurrencyKey } from '.';
import { CURRENCIES } from '.';

export const CURRENCY_IMAGES: Record<CurrencyKey, string> = {
  AUD: require('../../../assets/flags/au.jpg'),
  CAD: require('../../../assets/flags/ca.jpg'),
  CHF: require('../../../assets/flags/ch.jpg'),
  CNY: require('../../../assets/flags/cn.jpg'),
  EUR: require('../../../assets/flags/eu.jpg'),
  GBP: require('../../../assets/flags/gb.jpg'),
  INR: require('../../../assets/flags/in.jpg'),
  JPY: require('../../../assets/flags/jp.jpg'),
  KRW: require('../../../assets/flags/kr.jpg'),
  MYR: require('../../../assets/flags/my.jpg'),
  PLN: require('../../../assets/flags/pl.jpg'),
  THB: require('../../../assets/flags/th.jpg'),
  USD: require('../../../assets/flags/us.jpg'),
  ZAR: require('../../../assets/flags/za.jpg'),
};

export const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  ...currency,
  label: currency.value,
  subtext: currency.name,
  image: CURRENCY_IMAGES[currency.value as CurrencyKey],
}));
