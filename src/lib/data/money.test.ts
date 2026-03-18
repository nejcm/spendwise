import { parseToCents } from './money';

describe('parseToCents', () => {
  it('converts a valid string number to cents', () => {
    expect(parseToCents('12.34')).toBe(1234);
  });

  it('converts a whole number string to cents', () => {
    expect(parseToCents('5')).toBe(500);
  });

  it('returns null for null input', () => {
    expect(parseToCents(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseToCents(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseToCents('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(parseToCents('   ')).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(parseToCents('abc')).toBeNull();
  });

  it('returns null for NaN-producing string', () => {
    expect(parseToCents('not-a-number')).toBeNull();
  });

  it('handles zero correctly', () => {
    expect(parseToCents('0')).toBe(0);
  });

  it('handles negative values', () => {
    expect(parseToCents('-10.50')).toBe(-1050);
  });

  it('rounds to nearest cent', () => {
    expect(parseToCents('12.345')).toBe(1235);
    expect(parseToCents('12.344')).toBe(1234);
  });

  it('handles leading/trailing whitespace in valid input', () => {
    expect(parseToCents('  42.50  ')).toBe(4250);
  });
});
