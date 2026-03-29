import type { PeriodSelectionWeek } from '../store';
import {
  dateToUnix,
  getCurrentMonthRange,
  getPeriodRange,
  navigatePeriod,
  scaleBudgetForPeriod,
  splitByYear,
  unixToDate,
  unixToISODate,
} from '@/lib/date/helpers';

describe('getCurrentMonthRange', () => {
  it('returns start of month and start of next month', () => {
    expect(getCurrentMonthRange('2026-03')).toEqual([new Date(2026, 2, 1).getTime() / 1000, new Date(2026, 3, 1).getTime() / 1000]);
  });

  it('pads next month with leading zero', () => {
    expect(getCurrentMonthRange('2026-09')).toEqual([new Date(2026, 8, 1).getTime() / 1000, new Date(2026, 9, 1).getTime() / 1000]);
  });

  it('rolls over to next year for December', () => {
    expect(getCurrentMonthRange('2026-12')).toEqual([new Date(2026, 11, 1).getTime() / 1000, new Date(2027, 0, 1).getTime() / 1000]);
  });
});

// ─── dateToUnix / unixToDate / unixToISODate ──────────────────────────────────

describe('dateToUnix', () => {
  it('converts a Date object to unix seconds', () => {
    const date = new Date('2026-03-01T00:00:00.000Z');
    expect(dateToUnix(date)).toBe(Math.floor(date.getTime() / 1000));
  });

  it('converts a date string to unix seconds', () => {
    const unix = dateToUnix('2026-03-01');
    expect(typeof unix).toBe('number');
    expect(unix).toBeGreaterThan(0);
  });

  it('round-trips with unixToDate', () => {
    const date = new Date('2026-06-15T00:00:00.000Z');
    expect(unixToDate(dateToUnix(date)).getTime()).toBe(date.getTime());
  });
});

describe('unixToDate', () => {
  it('converts unix seconds to a Date', () => {
    const unix = 1_772_323_200;
    expect(unixToDate(unix).getTime()).toBe(unix * 1000);
  });
});

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
describe('unixToISODate', () => {
  it('returns a yyyy-MM-dd formatted string', () => {
    const unix = dateToUnix(new Date('2026-03-15T00:00:00.000Z'));
    expect(unixToISODate(unix)).toMatch(isoDateRegex);
  });
});

describe('splitByYear', () => {
  it('returns one segment when range is within a year', () => {
    expect(splitByYear('2026-03-01', '2026-06-15')).toEqual([{ start: '2026-03-01', end: '2026-06-15' }]);
  });

  it('splits across calendar years', () => {
    expect(splitByYear('2025-11-01', '2026-02-28')).toEqual([
      { start: '2025-11-01', end: '2025-12-31' },
      { start: '2026-01-01', end: '2026-02-28' },
    ]);
  });
});

// ─── getPeriodRange ───────────────────────────────────────────────────────────

describe('getPeriodRange', () => {
  it('year mode: spans full calendar year', () => {
    const [start, end] = getPeriodRange({ mode: 'year', year: 2026 }) as [number, number];
    expect(end - start).toBe(365 * 86400); // 2026 is not a leap year
  });

  it('month mode: end > start', () => {
    const [start, end] = getPeriodRange({ mode: 'month', year: 2026, month: 3 }) as [number, number];
    expect(end).toBeGreaterThan(start);
  });

  it('month mode: spans March (31 days)', () => {
    const [start, end] = getPeriodRange({ mode: 'month', year: 2026, month: 3 }) as [number, number];
    expect((end - start) / 86400).toBe(31);
  });

  it('week mode: spans approximately 7 days', () => {
    const [start, end] = getPeriodRange({ mode: 'week', year: 2026, week: 10 }) as [number, number];
    const days = (end - start) / 86400;
    // Implementation uses endOfISOWeek (23:59:59) + addDays(1), yielding ~8 days - 1s
    expect(days).toBeGreaterThan(7);
    expect(days).toBeLessThan(8);
  });

  it('custom mode: spans startDate to endDate inclusive', () => {
    const [start, end] = getPeriodRange({
      mode: 'custom',
      startDate: '2026-03-01',
      endDate: '2026-03-15',
    }) as [number, number];
    expect((end - start) / 86400).toBe(15);
  });

  it('all mode: returns undefined bounds', () => {
    const [start, end] = getPeriodRange({ mode: 'all' });
    expect(start).toBeUndefined();
    expect(end).toBeUndefined();
  });
});

// ─── navigatePeriod ───────────────────────────────────────────────────────────

describe('navigatePeriod', () => {
  it('year mode: increments year by 1', () => {
    expect(navigatePeriod({ mode: 'year', year: 2026 }, 1)).toEqual({ mode: 'year', year: 2027 });
  });

  it('year mode: decrements year by 1', () => {
    expect(navigatePeriod({ mode: 'year', year: 2026 }, -1)).toEqual({ mode: 'year', year: 2025 });
  });

  it('month mode: increments month', () => {
    expect(navigatePeriod({ mode: 'month', year: 2026, month: 6 }, 1)).toEqual({ mode: 'month', year: 2026, month: 7 });
  });

  it('month mode: wraps December → January of next year', () => {
    expect(navigatePeriod({ mode: 'month', year: 2026, month: 12 }, 1)).toEqual({ mode: 'month', year: 2027, month: 1 });
  });

  it('month mode: wraps January → December of previous year', () => {
    expect(navigatePeriod({ mode: 'month', year: 2026, month: 1 }, -1)).toEqual({ mode: 'month', year: 2025, month: 12 });
  });

  it('week mode: increments week within year', () => {
    expect(navigatePeriod({ mode: 'week', year: 2026, week: 10 }, 1)).toEqual({ mode: 'week', year: 2026, week: 11 });
  });

  it('week mode: wraps to week 1 of next year when past last week', () => {
    // Use an impossibly high week number to guarantee overflow
    const result = navigatePeriod({ mode: 'week', year: 2026, week: 53 }, 1) as PeriodSelectionWeek;
    expect(result.year).toBe(2027);
    expect(result.week).toBe(1);
  });

  it('week mode: wraps week 1 → last week of previous year', () => {
    const result = navigatePeriod({ mode: 'week', year: 2026, week: 1 }, -1) as PeriodSelectionWeek;
    expect(result.year).toBe(2025);
    expect(result.week).toBeGreaterThanOrEqual(52);
  });

  it('custom mode: shifts forward by range duration', () => {
    const result = navigatePeriod({ mode: 'custom', startDate: '2026-03-01', endDate: '2026-03-07' }, 1);
    expect(result).toEqual({ mode: 'custom', startDate: '2026-03-08', endDate: '2026-03-14' });
  });

  it('custom mode: shifts backward by range duration', () => {
    const result = navigatePeriod({ mode: 'custom', startDate: '2026-03-08', endDate: '2026-03-14' }, -1);
    expect(result).toEqual({ mode: 'custom', startDate: '2026-03-01', endDate: '2026-03-07' });
  });
});

// ─── scaleBudgetForPeriod ─────────────────────────────────────────────────────

describe('scaleBudgetForPeriod', () => {
  it('month mode: returns budget unchanged', () => {
    expect(scaleBudgetForPeriod(100_000, { mode: 'month', year: 2026, month: 3 })).toBe(100_000);
  });

  it('year mode: scales up to ~12 months', () => {
    const result = scaleBudgetForPeriod(100_000, { mode: 'year', year: 2026 });
    expect(result).toBeGreaterThan(100_000 * 11);
    expect(result).toBeLessThan(100_000 * 13);
  });

  it('week mode: scales down to less than monthly budget', () => {
    const result = scaleBudgetForPeriod(100_000, { mode: 'week', year: 2026, week: 10 });
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100_000);
  });

  it('custom mode (same month): prorates by days in period', () => {
    const result = scaleBudgetForPeriod(100_000, { mode: 'custom', startDate: '2026-03-01', endDate: '2026-03-15' });
    // 15/31 ≈ 48% of monthly budget
    expect(result).toBeGreaterThan(40_000);
    expect(result).toBeLessThan(60_000);
  });
});
