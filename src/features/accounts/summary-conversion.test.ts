import { computeAccountSummaryForViewCurrency } from './summary-conversion';

describe('computeAccountSummaryForViewCurrency', () => {
  const rates = { EUR: 1, USD: 1.08, GBP: 0.86 };

  it('converts mixed-currency rows to view currency', () => {
    const summary = computeAccountSummaryForViewCurrency(
      [
        { type: 'income', currency: 'EUR', total: 10_000 },
        { type: 'income', currency: 'USD', total: 5400 },
        { type: 'expense', currency: 'EUR', total: 3000 },
      ],
      'USD',
      rates,
    );

    expect(summary.income).toBe(16_200);
    expect(summary.expense).toBe(3240);
    expect(summary.balance).toBe(12_960);
  });

  it('returns zeros for empty rows', () => {
    const summary = computeAccountSummaryForViewCurrency([], 'EUR', rates);

    expect(summary).toEqual({ income: 0, expense: 0, balance: 0 });
  });

  it('falls back to rate 1 when rates map is empty', () => {
    const summary = computeAccountSummaryForViewCurrency(
      [{ type: 'income', currency: 'USD', total: 5000 }],
      'EUR',
      {},
    );

    expect(summary.income).toBe(5000);
    expect(summary.balance).toBe(5000);
  });
});
