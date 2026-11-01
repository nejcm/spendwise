import { currencyRateText, recentCurrencies } from './helpers';

const format = { numberFormat: 'stop-space', currencyFormat: 'symbol-before' } as const;

describe('recentCurrencies', () => {
  it('puts the Preferred Currency first and drops duplicates', () => {
    expect(recentCurrencies('EUR', ['USD', 'EUR', 'GBP'])).toEqual(['EUR', 'USD', 'GBP']);
  });

  it('caps the list and skips unknown codes', () => {
    expect(recentCurrencies('EUR', ['XXX' as never, 'USD', 'GBP', 'CHF', 'JPY', 'CAD'])).toEqual(['EUR', 'USD', 'GBP', 'CHF', 'JPY']);
  });

  it('works without a last-used list', () => {
    expect(recentCurrencies('USD')).toEqual(['USD']);
  });
});

describe('currencyRateText', () => {
  const rates = { USD: 1.18, GBP: 0.87, JPY: 170.5, IDR: 18000 };

  it('formats one unit of the Preferred Currency', () => {
    expect(currencyRateText('USD', 'EUR', rates, format)).toBe('€1 = $1.18');
  });

  it('crosses through EUR when the Preferred Currency is not EUR', () => {
    expect(currencyRateText('EUR', 'USD', rates, format)).toBe('$1 = €0.85');
    expect(currencyRateText('GBP', 'USD', rates, format)).toBe('$1 = £0.74');
  });

  it('keeps two significant digits for small rates', () => {
    expect(currencyRateText('EUR', 'IDR', rates, format)).toBe('Rp1 = €0.000056');
  });

  it('returns null without a cached rate', () => {
    expect(currencyRateText('CHF', 'EUR', rates, format)).toBeNull();
    expect(currencyRateText('USD', 'EUR', undefined, format)).toBeNull();
  });
});
