import { shortenNumber, shortenNumberString, toNumber } from '@/lib/number';

const DEFAULT_ABOVE = 1_000_000;

describe('toNumber', () => {
  it('parses numeric strings', () => {
    expect(toNumber('42')).toBe(42);
    expect(toNumber('-3.5')).toBe(-3.5);
  });

  it('returns the number when already a number', () => {
    expect(toNumber(7)).toBe(7);
  });

  it('returns fallback for null, undefined, empty string, or NaN input', () => {
    expect(toNumber(null, 0)).toBe(0);
    expect(toNumber(undefined, -1)).toBe(-1);
    expect(toNumber('', 99)).toBe(99);
    expect(toNumber('not a number', 0)).toBe(0);
  });

  it('returns undefined as fallback when omitted and value is empty', () => {
    expect(toNumber(null)).toBeUndefined();
  });
});

describe('shortenNumber', () => {
  describe('above threshold (default: 1e6)', () => {
    it('returns raw value with empty suffix when |val| is below default above', () => {
      expect(shortenNumber(0)).toEqual([0, '']);
      expect(shortenNumber(42.3)).toEqual([42.3, '']);
      expect(shortenNumber(999_999)).toEqual([999_999, '']);
      expect(shortenNumber(-500_000)).toEqual([-500_000, '']);
    });

    it('shortens only when |val| >= above', () => {
      expect(shortenNumber(999_999, DEFAULT_ABOVE)).toEqual([999_999, '']);
      expect(shortenNumber(1_000_000, DEFAULT_ABOVE)).toEqual([1, 'm']);
    });
  });

  describe('suffix ladder when shortening applies', () => {
    it('uses k when magnitude is in [1e3, 1e6)', () => {
      expect(shortenNumber(1000, 1000)).toEqual([1, 'k']);
      expect(shortenNumber(1500, 1000)).toEqual([1.5, 'k']);
      expect(shortenNumber(999_999, 1000)).toEqual([1000, 'k']);
      expect(shortenNumber(-1000, 1000)).toEqual([-1, 'k']);
      expect(shortenNumber(-2500, 1000)).toEqual([-2.5, 'k']);
    });

    it('uses m when magnitude is in [1e6, 1e9)', () => {
      expect(shortenNumber(1_000_000, 1000)).toEqual([1, 'm']);
      expect(shortenNumber(1_500_000, 1000)).toEqual([1.5, 'm']);
      expect(shortenNumber(999_999_999, 1000)).toEqual([1000, 'm']);
      expect(shortenNumber(-1_000_000, 1000)).toEqual([-1, 'm']);
    });

    it('uses b at 1e9 and beyond', () => {
      expect(shortenNumber(1_000_000_000, 1000)).toEqual([1, 'b']);
      expect(shortenNumber(2_500_000_000, 1000)).toEqual([2.5, 'b']);
      expect(shortenNumber(-3_000_000_000, 1000)).toEqual([-3, 'b']);
    });

    it('keeps small magnitudes as plain numbers inside the shortener (k branch)', () => {
      expect(shortenNumber(500, 1000)).toEqual([500, '']);
      expect(shortenNumber(-200, 1000)).toEqual([-200, '']);
    });
  });

  describe('rounding', () => {
    it('uses the third argument as decimal places for shortened values', () => {
      expect(shortenNumber(1234, 0, 0)).toEqual([1, 'k']);
      expect(shortenNumber(1234, 0, 2)).toEqual([1.23, 'k']);
    });

    it('ignores round when |val| is below above (returns raw value)', () => {
      expect(shortenNumber(999.456, DEFAULT_ABOVE, 2)).toEqual([999.456, '']);
    });
  });
});

describe('shortenNumberString', () => {
  it('returns undefined when value is undefined', () => {
    expect(shortenNumberString(undefined)).toBeUndefined();
  });

  it('with default above, leaves sub-million values unshortened', () => {
    expect(shortenNumberString(1500)).toBe('1500');
    expect(shortenNumberString(-2000)).toBe('-2000');
  });

  it('concatenates shortened value and suffix when |val| >= above', () => {
    expect(shortenNumberString(1_500_000)).toBe('1.5m');
    expect(shortenNumberString(-2_000_000)).toBe('-2m');
  });

  it('applies optional format to the numeric part only', () => {
    expect(
      shortenNumberString(1500, 1000, 1, (n) => n.toFixed(2)),
    ).toBe('1.50k');

    expect(
      shortenNumberString(1_500_000, 1000, 1, () => 'approx'),
    ).toBe('approxm');
  });
});
