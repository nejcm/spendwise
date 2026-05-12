import type { CurrencyFormat, NumberFormat } from './constants';
import { formatCurrency, formatNumber } from './helpers';

const number = 1234.56;
const negativeNumber = -1234.56;
const cents = 123_456;
const negativeCents = -cents;

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

  it('formats negative numbers correctly', () => {
    const expectedNumbers: Record<NumberFormat, string> = {
      'stop': '-1234.56',
      'stop-space': '-1,234.56',
      'comma': '-1234,56',
      'comma-space': '-1.234,56',
    };

    for (const numberFormat of Object.keys(expectedNumbers) as NumberFormat[]) {
      const result = formatNumber(negativeNumber, numberFormat);
      expect(result).toBe(expectedNumbers[numberFormat]);
    }
  });

  it('respects fractionDigits as maximum fractional digits in formatNumber', () => {
    const value = 1234.567;
    const expected0: Record<NumberFormat, string> = {
      'stop': '1235',
      'stop-space': '1,235',
      'comma': '1235',
      'comma-space': '1.235',
    };
    const expected3: Record<NumberFormat, string> = {
      'stop': '1234.567',
      'stop-space': '1,234.567',
      'comma': '1234,567',
      'comma-space': '1.234,567',
    };

    for (const numberFormat of Object.keys(expected0) as NumberFormat[]) {
      expect(formatNumber(value, numberFormat, 0)).toBe(expected0[numberFormat]);
      expect(formatNumber(value, numberFormat, 3)).toBe(expected3[numberFormat]);
    }
  });

  it('respects fractionDigits in formatCurrency when not shortened', () => {
    const expected0: Record<CurrencyFormat, string> = {
      'symbol-after': '1.235$',
      'symbol-before': '$1.235',
      'code-after': '1.235\u00A0USD',
      'code-before': 'USD\u00A01.235',
    };
    const expected1: Record<CurrencyFormat, string> = {
      'symbol-after': '1.234,6$',
      'symbol-before': '$1.234,6',
      'code-after': '1.234,6\u00A0USD',
      'code-before': 'USD\u00A01.234,6',
    };

    for (const currencyFormat of Object.keys(expected0) as CurrencyFormat[]) {
      expect(
        formatCurrency(cents, 'USD', {
          numberFormat: 'comma-space',
          currencyFormat,
          fractionDigits: 0,
        }),
      ).toBe(expected0[currencyFormat]);
      expect(
        formatCurrency(cents, 'USD', {
          numberFormat: 'comma-space',
          currencyFormat,
          fractionDigits: 1,
        }),
      ).toBe(expected1[currencyFormat]);
    }
  });

  it('returns the original value as string for non-finite input', () => {
    expect(formatCurrency('not-a-number', 'USD')).toBe('not-a-number');
  });

  it('uses symbol display for symbol currency formats', () => {
    for (const currencyFormat of ['symbol-after', 'symbol-before'] as CurrencyFormat[]) {
      const result = formatCurrency(cents, 'USD', { numberFormat: 'comma-space', currencyFormat });
      expect(result).toContain('$');
      expect(result).not.toContain('USD');
    }
  });

  it('uses code display for code currency formats', () => {
    for (const currencyFormat of ['code-after', 'code-before'] as CurrencyFormat[]) {
      const result = (formatCurrency(cents, 'USD', { numberFormat: 'comma-space', currencyFormat }));
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

    for (const currencyFormat of Object.keys(expectedNumbers) as CurrencyFormat[]) {
      const result = formatCurrency(cents, 'USD', { numberFormat: 'comma-space', currencyFormat });
      expect(result).toBe(expectedNumbers[currencyFormat]);
    }
  });

  it('applies number/currency formats for negative cents', () => {
    const expectedNumbers: Record<CurrencyFormat, string> = {
      'symbol-after': '-1.234,56$',
      'symbol-before': '-$1.234,56',
      'code-after': '-1.234,56 USD',
      'code-before': '-USD 1.234,56',
    };

    for (const currencyFormat of Object.keys(expectedNumbers) as CurrencyFormat[]) {
      const result = formatCurrency(negativeCents, 'USD', { numberFormat: 'comma-space', currencyFormat });
      expect(result).toBe(expectedNumbers[currencyFormat]);
    }
  });

  it('shortens the numeric part when shorten is true', () => {
    expect(
      formatCurrency(cents, 'USD', {
        numberFormat: 'comma-space',
        currencyFormat: 'symbol-before',
        shorten: true,
      }),
    ).toBe('$1.23k');
    expect(
      formatCurrency(50_000, 'USD', {
        numberFormat: 'comma-space',
        currencyFormat: 'symbol-before',
        shorten: true,
      }),
    ).toBe('$500');
  });

  it('prefixes minus before currency for negative symbol-before when negativeSymbol is true', () => {
    expect(
      formatCurrency(negativeCents, 'USD', {
        numberFormat: 'comma-space',
        currencyFormat: 'symbol-before',
        shorten: true,
        negativeSymbol: true,
      }),
    ).toBe('-$1.23k');
  });

  it('omits leading minus for symbol-before negatives when negativeSymbol is false', () => {
    expect(
      formatCurrency(negativeCents, 'USD', {
        numberFormat: 'comma-space',
        currencyFormat: 'symbol-before',
        shorten: true,
        negativeSymbol: false,
        fractionDigits: 1,
      }),
    ).toBe('$1.2k');
    expect(
      formatCurrency(negativeCents, 'USD', {
        numberFormat: 'comma-space',
        currencyFormat: 'code-before',
        shorten: true,
        negativeSymbol: false,
        fractionDigits: 1,
      }),
    ).toBe('USD 1.2k');
  });
});
