import type { CurrencyFormat, NumberFormat } from './constants';
import i18n from 'i18next';
import { formatCurrency, formatDateFull, formatInstantFull, formatNumber, splitFraction } from './helpers';

const number = 1234.56;
const negativeNumber = -1234.56;
const cents = 123_456;
const negativeCents = -cents;

describe('formatting helpers', () => {
  it('keeps UTC-midnight date-only epochs on their stored calendar day', () => {
    expect(formatDateFull(Date.UTC(2026, 6, 1) / 1000, 'yyyy-MM-dd')).toBe('2026-07-01');
  });

  it('formats instants in local time instead of as calendar dates', () => {
    // 2026-07-01T02:00Z is still 2026-06-30 in America/Los_Angeles (test TZ).
    const instant = Date.UTC(2026, 6, 1, 2, 0) / 1000;
    expect(formatInstantFull(instant, 'yyyy-MM-dd')).toBe('2026-06-30');
    expect(formatDateFull(instant, 'yyyy-MM-dd')).toBe('2026-07-01');
  });

  it('localizes month and day names to the app language, leaving numeric formats alone', async () => {
    const day = Date.UTC(2026, 9, 15) / 1000;
    expect(formatDateFull(day, 'EEEE, MMM d')).toBe('Thursday, Oct 15');
    await i18n.changeLanguage('de');
    try {
      expect(formatDateFull(day, 'EEEE, MMM d')).toBe('Donnerstag, Okt. 15');
      expect(formatDateFull(day, 'dd.MM.yyyy')).toBe('15.10.2026');
    }
    finally {
      await i18n.changeLanguage('en');
    }
  });

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

  it('always shows two fraction digits for an amount with cents, none for a whole amount', () => {
    const format = { numberFormat: 'stop', currencyFormat: 'symbol-after' } as const;
    expect(formatCurrency(-4250, 'USD', format)).toBe('-42.50$');
    expect(formatCurrency(4205, 'USD', format)).toBe('42.05$');
    expect(formatCurrency(4200, 'USD', format)).toBe('42$');
    expect(formatCurrency(4250, 'USD', { ...format, fractionDigits: 0 })).toBe('43$');
    expect(formatCurrency(4250, 'USD', { numberFormat: 'comma', currencyFormat: 'symbol-before', shorten: true })).toBe('$42,50');
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

  it.each([
    ['€7,400.75', 'stop-space', ['€7,400', '.75', '']],
    ['-€7,400.75', 'stop-space', ['-€7,400', '.75', '']],
    ['€7,400', 'stop-space', ['€7,400', '', '']],
    ['7.400,75€', 'comma-space', ['7.400', ',75', '€']],
    ['7.400€', 'comma-space', ['7.400€', '', '']],
    ['USD 1234.5', 'stop', ['USD 1234', '.5', '']],
    ['1234,56 USD', 'comma', ['1234', ',56', ' USD']],
  ])('splits %p (%p) around its fraction', (formatted: string, numberFormat: NumberFormat, expected: string[]) => {
    expect(splitFraction(formatted, numberFormat)).toEqual(expected);
  });
});
