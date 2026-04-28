import { getMonthBoundaries } from '@/lib/date/helpers';

import { getBudgetSelectionBoundaries, scaleGlobalBudget } from './helpers';

// ─── getBudgetSelectionBoundaries ─────────────────────────────────────────────

describe('getBudgetSelectionBoundaries', () => {
  it('month mode: returns start and end of the given month', () => {
    const [start, end] = getBudgetSelectionBoundaries({ mode: 'month', year: 2026, month: 3 });
    const [expectedStart, expectedEnd] = getMonthBoundaries(2026, 3);
    expect(start).toBe(expectedStart);
    expect(end).toBe(expectedEnd);
  });

  it('year mode: spans from January 1 to January 1 next year', () => {
    const [start, end] = getBudgetSelectionBoundaries({ mode: 'year', year: 2026 });
    const [expectedStart] = getMonthBoundaries(2026, 1);
    const [, expectedEnd] = getMonthBoundaries(2026, 12);
    expect(start).toBe(expectedStart);
    expect(end).toBe(expectedEnd);
  });

  it('year mode: span covers 12 months', () => {
    const [start, end] = getBudgetSelectionBoundaries({ mode: 'year', year: 2026 });
    const [jan] = getMonthBoundaries(2026, 1);
    const [, dec] = getMonthBoundaries(2026, 12);
    expect(start).toBe(jan);
    expect(end).toBe(dec);
    expect(end).toBeGreaterThan(start);
  });

  it('range mode: spans from start month to end of end month', () => {
    const [start, end] = getBudgetSelectionBoundaries({
      mode: 'range',
      startYear: 2026,
      startMonth: 2,
      endYear: 2026,
      endMonth: 4,
    });
    const [expectedStart] = getMonthBoundaries(2026, 2);
    const [, expectedEnd] = getMonthBoundaries(2026, 4);
    expect(start).toBe(expectedStart);
    expect(end).toBe(expectedEnd);
  });

  it('range mode spanning a year boundary', () => {
    const [start, end] = getBudgetSelectionBoundaries({
      mode: 'range',
      startYear: 2025,
      startMonth: 11,
      endYear: 2026,
      endMonth: 2,
    });
    const [expectedStart] = getMonthBoundaries(2025, 11);
    const [, expectedEnd] = getMonthBoundaries(2026, 2);
    expect(start).toBe(expectedStart);
    expect(end).toBe(expectedEnd);
  });
});

// ─── scaleGlobalBudget ────────────────────────────────────────────────────────

describe('scaleGlobalBudget', () => {
  it('month mode: returns the budget unchanged (×1)', () => {
    expect(scaleGlobalBudget(100_000, { mode: 'month', year: 2026, month: 3 })).toBe(100_000);
  });

  it('year mode: scales to 12 months', () => {
    expect(scaleGlobalBudget(100_000, { mode: 'year', year: 2026 })).toBe(1_200_000);
  });

  it('range mode: scales by the number of months in the range', () => {
    // Feb–Apr = 3 months
    expect(scaleGlobalBudget(100_000, {
      mode: 'range',
      startYear: 2026,
      startMonth: 2,
      endYear: 2026,
      endMonth: 4,
    })).toBe(300_000);
  });

  it('range mode: single month range equals monthly budget', () => {
    expect(scaleGlobalBudget(100_000, {
      mode: 'range',
      startYear: 2026,
      startMonth: 3,
      endYear: 2026,
      endMonth: 3,
    })).toBe(100_000);
  });

  it('range mode: caps at 36 months for very long ranges', () => {
    // 40-month range — should be capped at 36
    const result = scaleGlobalBudget(100_000, {
      mode: 'range',
      startYear: 2023,
      startMonth: 1,
      endYear: 2026,
      endMonth: 4,
    });
    expect(result).toBe(100_000 * 36);
  });
});
