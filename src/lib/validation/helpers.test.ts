import { refinePositiveNumber, refinePositiveNumberOrNull } from './helpers';

// ─── refinePositiveNumber ─────────────────────────────────────────────────────

describe('refinePositiveNumber', () => {
  it('returns false for null', () => {
    expect(refinePositiveNumber(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(refinePositiveNumber(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(refinePositiveNumber('')).toBe(false);
  });

  it('returns false for zero', () => {
    expect(refinePositiveNumber(0)).toBe(false);
  });

  it('returns false for negative number', () => {
    expect(refinePositiveNumber(-1)).toBe(false);
    expect(refinePositiveNumber('-5')).toBe(false);
  });

  it('returns true for positive integer', () => {
    expect(refinePositiveNumber(1)).toBe(true);
    expect(refinePositiveNumber(100)).toBe(true);
  });

  it('returns true for positive decimal', () => {
    expect(refinePositiveNumber(0.01)).toBe(true);
    expect(refinePositiveNumber('9.99')).toBe(true);
  });

  it('returns true for positive integer string', () => {
    expect(refinePositiveNumber('42')).toBe(true);
  });
});

// ─── refinePositiveNumberOrNull ───────────────────────────────────────────────

describe('refinePositiveNumberOrNull', () => {
  it('returns true for null', () => {
    expect(refinePositiveNumberOrNull(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(refinePositiveNumberOrNull(undefined)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(refinePositiveNumberOrNull('')).toBe(true);
  });

  it('returns false for zero', () => {
    expect(refinePositiveNumberOrNull(0)).toBe(false);
  });

  it('returns false for negative number', () => {
    expect(refinePositiveNumberOrNull(-10)).toBe(false);
  });

  it('returns true for positive number', () => {
    expect(refinePositiveNumberOrNull(50)).toBe(true);
  });

  it('returns true for positive number string', () => {
    expect(refinePositiveNumberOrNull('100')).toBe(true);
  });
});
