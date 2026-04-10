import type { CurrencyKey } from '.';
import { CURRENCIES } from '.';

export const CURRENCY_IMAGES: Record<CurrencyKey, string> = {
  AUD: require('../../../assets/flags/au.jpg'),
  BRL: require('../../../assets/flags/br.jpg'),
  CAD: require('../../../assets/flags/ca.jpg'),
  CHF: require('../../../assets/flags/ch.jpg'),
  CNY: require('../../../assets/flags/cn.jpg'),
  CZK: require('../../../assets/flags/cz.jpg'),
  DKK: require('../../../assets/flags/dk.jpg'),
  EUR: require('../../../assets/flags/eu.jpg'),
  GBP: require('../../../assets/flags/gb.jpg'),
  HKD: require('../../../assets/flags/hk.jpg'),
  HUF: require('../../../assets/flags/hu.jpg'),
  IDR: require('../../../assets/flags/id.jpg'),
  ILS: require('../../../assets/flags/il.jpg'),
  INR: require('../../../assets/flags/in.jpg'),
  ISK: require('../../../assets/flags/is.jpg'),
  JPY: require('../../../assets/flags/jp.jpg'),
  KRW: require('../../../assets/flags/kr.jpg'),
  MXN: require('../../../assets/flags/mx.jpg'),
  MYR: require('../../../assets/flags/my.jpg'),
  NOK: require('../../../assets/flags/no.jpg'),
  NZD: require('../../../assets/flags/nz.jpg'),
  PHP: require('../../../assets/flags/ph.jpg'),
  PLN: require('../../../assets/flags/pl.jpg'),
  RON: require('../../../assets/flags/ro.jpg'),
  SEK: require('../../../assets/flags/se.jpg'),
  SGD: require('../../../assets/flags/sg.jpg'),
  THB: require('../../../assets/flags/th.jpg'),
  TRY: require('../../../assets/flags/tr.jpg'),
  USD: require('../../../assets/flags/us.jpg'),
  ZAR: require('../../../assets/flags/za.jpg'),
};

export const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  ...currency,
  label: currency.value,
  subtext: currency.name,
  image: CURRENCY_IMAGES[currency.value as CurrencyKey],
}));
