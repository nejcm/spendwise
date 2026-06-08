import { calcDeltaPct } from './api';

describe('calcDeltaPct', () => {
  it('returns null when prior is 0 and current is non-zero (percent change is undefined)', () => {
    expect(calcDeltaPct(100, 0)).toBeNull();
  });

  it('returns 0 when both are 0', () => {
    expect(calcDeltaPct(0, 0)).toBe(0);
  });

  it('returns 0 when values are identical (zero delta is still a value)', () => {
    expect(calcDeltaPct(500, 500)).toBe(0);
  });

  it('returns positive percent when current is higher than prior', () => {
    expect(calcDeltaPct(150, 100)).toBe(50);
  });

  it('returns negative percent when current is lower than prior', () => {
    expect(calcDeltaPct(80, 100)).toBe(-20);
  });

  it('rounds to nearest integer', () => {
    // 110 / 100 - 1 = 0.1 → 10%
    expect(calcDeltaPct(110, 100)).toBe(10);
    // 111 / 100 - 1 = 0.11 → rounds to 11%
    expect(calcDeltaPct(111, 100)).toBe(11);
    // 115.5 / 100 - 1 = 0.155 → rounds to 16%
    expect(calcDeltaPct(11550, 10000)).toBe(16);
  });

  it('handles large multiples (no division-by-zero, just large output)', () => {
    expect(calcDeltaPct(1_000_000, 100)).toBe(999900);
  });
});
