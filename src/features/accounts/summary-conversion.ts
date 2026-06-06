import type { AccountSummaryNativeRow } from './queries';

import type { CurrencyKey } from '@/features/currencies';
import type { RatesMap } from '@/features/currencies/queries';
import type { MonthSummary } from '@/features/transactions/types';

import { convertAmount } from '@/lib/data/money';

export function computeAccountSummaryForViewCurrency(
  rows: AccountSummaryNativeRow[],
  viewCurrency: CurrencyKey,
  rates: RatesMap,
): MonthSummary {
  let income = 0;
  let expense = 0;

  for (const row of rows) {
    const converted = convertAmount(row.total, row.currency, viewCurrency, rates);
    if (row.type === 'income') {
      income += converted;
    }
    else {
      expense += converted;
    }
  }

  return { income, expense, balance: income - expense };
}
