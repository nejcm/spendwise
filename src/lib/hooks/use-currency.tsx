import { useMMKVString } from 'react-native-mmkv';

import { storage } from '../storage';

const CURRENCY_KEY = 'APP_CURRENCY';
const DEFAULT_CURRENCY = 'EUR';

export function useCurrency() {
  const [currency, setCurrency] = useMMKVString(CURRENCY_KEY, storage);
  return [currency ?? DEFAULT_CURRENCY, setCurrency] as const;
}

export function getCurrency(): string {
  return storage.getString(CURRENCY_KEY) ?? DEFAULT_CURRENCY;
}
