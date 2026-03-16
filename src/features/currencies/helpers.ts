import type { CurrencyKey } from '.';
import type { OptionType } from '@/components/ui';
import { CURRENCIES_MAP } from '.';

export function mergeCurrencyArrays(lastUsed: CurrencyKey[] | undefined, all: OptionType[]): OptionType[] {
  if (!lastUsed) return all;
  const usedMap: Partial<Record<CurrencyKey, boolean>> = {};
  const result: OptionType[] = [];
  for (const key of lastUsed) {
    const curr = CURRENCIES_MAP[key];
    if (!curr) continue;
    usedMap[key] = true;
    result.push({ ...curr, label: curr.value, subtext: curr.name });
  }
  for (const currency of all) {
    if (usedMap[currency.value as CurrencyKey]) continue;
    result.push(currency);
  }
  return result;
}
