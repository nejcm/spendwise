import type { CurrencyFormat, NumberFormat } from './constants';
import { formatCurrency, formatNumber } from './helpers';

const number = 1234.56;
const cents = 123_456;

describe('formatting helpers', () => {
  it('formats a number correctly', () => {
    const expectedNumbers: Record<NumberFormat, string> = {
      'stop': '1234.56',
      'stop-space': '1,234.56',
      'comma': '1234,56',
      'comma-space': '1.234,56',
    };

    for (const numberFormat of Object.keys(expectedNumbers) as NumberFormat[]) {
      const result = formatNumber(number, numberFormat);
      expect(result).toBe(expectedNumbers[numberFormat]);
    }
  });

  it('returns the original value as string for non-finite input', () => {
    expect(formatCurrency('not-a-number', 'USD')).toBe('not-a-number');
  });

  it('uses symbol display for symbol currency formats', () => {
    for (const currencyFormat of ['symbol-after', 'symbol-before'] as CurrencyFormat[]) {
      const result = formatCurrency(cents, 'USD', 'comma-space', currencyFormat);
      expect(result).toContain('$');
      expect(result).not.toContain('USD');
    }
  });

  it('uses code display for code currency formats', () => {
    for (const currencyFormat of ['code-after', 'code-before'] as CurrencyFormat[]) {
      const result = (formatCurrency(cents, 'USD', 'comma-space', currencyFormat));
      expect(result).toContain('USD');
      expect(result).not.toContain('$');
    }
  });

  it('applies the configured number format variants', () => {
    const expectedNumbers: Record<CurrencyFormat, string> = {
      'symbol-after': '1.234,56$',
      'symbol-before': '$1.234,56',
      'code-after': '1.234,56 USD',
      'code-before': 'USD 1.234,56',
    };

    for (const numberFormat of Object.keys(expectedNumbers) as CurrencyFormat[]) {
      const result = formatCurrency(cents, 'USD', 'comma-space', numberFormat);
      expect(result).toBe(expectedNumbers[numberFormat]);
    }
  });
});
