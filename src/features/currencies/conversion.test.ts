import { computeBaseAmount } from './conversion';

describe('computeBaseAmount', () => {
  const rates = { EUR: 1, USD: 1.08, GBP: 0.86, JPY: 162.5 };

  it('returns amountCents unchanged when currencies match', () => {
    expect(computeBaseAmount(5000, 'EUR', 'EUR', rates)).toBe(5000);
    expect(computeBaseAmount(5000, 'USD', 'USD', rates)).toBe(5000);
  });

  it('converts EUR to USD correctly', () => {
    // 50 EUR → 54 USD  (5000 cents / 1 * 1.08 = 5400)
    expect(computeBaseAmount(5000, 'EUR', 'USD', rates)).toBe(5400);
  });

  it('converts USD to EUR correctly', () => {
    // 108 USD → 100 EUR  (10800 / 1.08 * 1 = 10000)
    expect(computeBaseAmount(10800, 'USD', 'EUR', rates)).toBe(10000);
  });

  it('converts USD to GBP via EUR (cross-rate)', () => {
    // 108 USD → 100 EUR → 86 GBP
    // 10800 cents USD / 1.08 * 0.86 = 8600
    expect(computeBaseAmount(10800, 'USD', 'GBP', rates)).toBe(8600);
  });

  it('rounds to nearest cent', () => {
    // 1 USD = 0.9259… EUR — result must be a whole number (cents)
    const result = computeBaseAmount(100, 'USD', 'EUR', rates);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('returns 0 for 0 cents input', () => {
    expect(computeBaseAmount(0, 'USD', 'EUR', rates)).toBe(0);
  });

  it('falls back to rate 1 for unknown currency', () => {
    // Missing 'XYZ' falls back to rate 1 (treated as 1:1 with EUR)
    const result = computeBaseAmount(5000, 'XYZ' as any, 'EUR', rates);
    expect(result).toBe(5000);
  });
});
