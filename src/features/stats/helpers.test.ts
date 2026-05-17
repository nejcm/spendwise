import type { GlobalBudget } from './global-budget-queries';
import { getMonthBoundaries } from '@/lib/date/helpers';

import { budgetPeriodLabel, getBudgetSelectionBoundaries, scaleGlobalBudget } from './helpers';

const MONTHLY: GlobalBudget = { amountCents: 100_000, type: 'monthly' };
const YEARLY: GlobalBudget = { amountCents: 1_200_000, type: 'yearly' };

// ─── getBudgetSelectionBoundaries ─────────────────────────────────────────────

describe('getBudgetSelectionBoundaries', () => {
  it('day mode: spans one selected local calendar day', () => {
    const [start, end] = getBudgetSelectionBoundaries({ mode: 'day', date: '2026-03-15' });
    expect(start).toBe(new Date(2026, 2, 15).getTime() / 1000);
    expect(end).toBe(new Date(2026, 2, 16).getTime() / 1000);
  });

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
  describe('monthly budget', () => {
    it('day mode: prorates by days in the selected month', () => {
      expect(scaleGlobalBudget({ amountCents: 310_000, type: 'monthly' }, { mode: 'day', date: '2026-03-15' })).toBe(10_000);
      expect(scaleGlobalBudget({ amountCents: 280_000, type: 'monthly' }, { mode: 'day', date: '2026-02-15' })).toBe(10_000);
    });

    it('month mode: returns the budget unchanged (×1)', () => {
      expect(scaleGlobalBudget(MONTHLY, { mode: 'month', year: 2026, month: 3 })).toBe(100_000);
    });

    it('year mode: scales to 12 months', () => {
      expect(scaleGlobalBudget(MONTHLY, { mode: 'year', year: 2026 })).toBe(1_200_000);
    });

    it('range mode: scales by the number of months in the range', () => {
      expect(scaleGlobalBudget(MONTHLY, {
        mode: 'range',
        startYear: 2026,
        startMonth: 2,
        endYear: 2026,
        endMonth: 4,
      })).toBe(300_000);
    });

    it('range mode: single month range equals monthly budget', () => {
      expect(scaleGlobalBudget(MONTHLY, {
        mode: 'range',
        startYear: 2026,
        startMonth: 3,
        endYear: 2026,
        endMonth: 3,
      })).toBe(100_000);
    });

    it('range mode: caps at 36 months for very long ranges', () => {
      const result = scaleGlobalBudget(MONTHLY, {
        mode: 'range',
        startYear: 2023,
        startMonth: 1,
        endYear: 2026,
        endMonth: 4,
      });
      expect(result).toBe(100_000 * 36);
    });
  });

  describe('yearly budget', () => {
    it('day mode: prorates by days in the selected year', () => {
      expect(scaleGlobalBudget({ amountCents: 366_000, type: 'yearly' }, { mode: 'day', date: '2024-03-15' })).toBe(1_000);
      expect(scaleGlobalBudget({ amountCents: 365_000, type: 'yearly' }, { mode: 'day', date: '2025-03-15' })).toBe(1_000);
    });

    it('month mode: pro-rates to 1/12 of yearly amount', () => {
      expect(scaleGlobalBudget(YEARLY, { mode: 'month', year: 2026, month: 3 })).toBe(100_000);
    });

    it('year mode: returns full yearly amount', () => {
      expect(scaleGlobalBudget(YEARLY, { mode: 'year', year: 2026 })).toBe(1_200_000);
    });

    it('range mode: pro-rates across months in the range', () => {
      // 3 months → 1_200_000 / 12 * 3 = 300_000
      expect(scaleGlobalBudget(YEARLY, {
        mode: 'range',
        startYear: 2026,
        startMonth: 2,
        endYear: 2026,
        endMonth: 4,
      })).toBe(300_000);
    });
  });
});

// ─── budgetPeriodLabel ───────────────────────────────────────────────────────

describe('budgetPeriodLabel', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 2, 15, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('day mode: labels nearby days relatively', () => {
    expect(budgetPeriodLabel({ mode: 'day', date: '2026-03-14' })).toBe('Yesterday');
    expect(budgetPeriodLabel({ mode: 'day', date: '2026-03-15' })).toBe('Today');
    expect(budgetPeriodLabel({ mode: 'day', date: '2026-03-16' })).toBe('Tomorrow');
  });

  it('day mode: formats the selected day', () => {
    expect(budgetPeriodLabel({ mode: 'day', date: '2026-03-20' })).toBe('Mar 20, 2026');
  });
});
