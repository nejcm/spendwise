import type { PeriodSelectionWeek } from '../store/store';
import {
  calendarDateToUnix,
  commitPickerDate,
  dateToUnix,
  findClosestDateBinary,
  getCurrentMonthRange,
  getPeriodRange,
  navigatePeriod,
  scaleBudgetForPeriod,
  splitBy,
  unixToCalendarDate,
  unixToDate,
  unixToISODate,
} from '@/lib/date/helpers';

describe('getCurrentMonthRange', () => {
  it('returns start of month and start of next month', () => {
    expect(getCurrentMonthRange('2026-03')).toEqual([Date.UTC(2026, 2, 1) / 1000, Date.UTC(2026, 3, 1) / 1000]);
  });

  it('pads next month with leading zero', () => {
    expect(getCurrentMonthRange('2026-09')).toEqual([Date.UTC(2026, 8, 1) / 1000, Date.UTC(2026, 9, 1) / 1000]);
  });

  it('rolls over to next year for December', () => {
    expect(getCurrentMonthRange('2026-12')).toEqual([Date.UTC(2026, 11, 1) / 1000, Date.UTC(2027, 0, 1) / 1000]);
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

describe('utc date-only conversion', () => {
  it('stores local calendar fields at UTC midnight', () => {
    expect(calendarDateToUnix(new Date(2026, 6, 1, 12))).toBe(Date.UTC(2026, 6, 1) / 1000);
  });

  it('renders a production UTC-midnight epoch as the same local calendar day', () => {
    const storedEpoch = Date.UTC(2026, 6, 1) / 1000;
    expect(new Date(storedEpoch * 1000).getDate()).toBe(30);

    const date = unixToCalendarDate(storedEpoch);
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 6, 1]);
  });
});

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
describe('unixToISODate', () => {
  it('returns the UTC calendar date in yyyy-MM-dd format', () => {
    const unix = Date.UTC(2026, 2, 15) / 1000;
    expect(unixToISODate(unix)).toBe('2026-03-15');
    expect(unixToISODate(unix)).toMatch(isoDateRegex);
  });
});

describe('commitPickerDate', () => {
  const date = new Date(2020, 5, 16);

  it('returns yyyy-MM-dd on set', () => {
    expect(commitPickerDate({ type: 'set' }, date)).toBe('2020-06-16');
  });

  it('returns null on dismissed even when a date is present', () => {
    expect(commitPickerDate({ type: 'dismissed' }, date)).toBeNull();
  });

  it('returns null on set without a date', () => {
    expect(commitPickerDate({ type: 'set' })).toBeNull();
  });
});

describe('splitBy', () => {
  it('default chunkSize (1y): one segment when range is within a year', () => {
    expect(splitBy('2026-03-01', '2026-06-15')).toEqual([{ start: '2026-03-01', end: '2026-06-15' }]);
  });

  it('default chunkSize (1y): one segment when crossing calendar year but inside first 1y window', () => {
    expect(splitBy('2025-11-01', '2026-02-28')).toEqual([{ start: '2025-11-01', end: '2026-02-28' }]);
  });

  it('chunkSize 2: boundaries follow start-date anniversaries (mid-year anchor)', () => {
    expect(splitBy('2020-11-20', '2025-03-15', 2)).toEqual([
      { start: '2020-11-20', end: '2022-11-20' },
      { start: '2022-11-21', end: '2024-11-20' },
      { start: '2024-11-21', end: '2025-03-15' },
    ]);
  });

  it('chunkSize 1: one segment when end before first anniversary', () => {
    expect(splitBy('2025-11-01', '2026-02-28', 1)).toEqual([{ start: '2025-11-01', end: '2026-02-28' }]);
  });

  it('chunkSize 1: splits at yearly anniversaries from anchor', () => {
    expect(splitBy('2025-11-01', '2027-01-15', 1)).toEqual([
      { start: '2025-11-01', end: '2026-11-01' },
      { start: '2026-11-02', end: '2027-01-15' },
    ]);
  });

  it('chunkSize 2: Jan 1 anchor uses anniversary boundaries', () => {
    expect(splitBy('2020-01-01', '2025-06-15', 2)).toEqual([
      { start: '2020-01-01', end: '2022-01-01' },
      { start: '2022-01-02', end: '2024-01-01' },
      { start: '2024-01-02', end: '2025-06-15' },
    ]);
  });

  it('chunkSize 3: three-year chunks from anchor', () => {
    expect(splitBy('2020-01-01', '2024-06-01', 3)).toEqual([
      { start: '2020-01-01', end: '2023-01-01' },
      { start: '2023-01-02', end: '2024-06-01' },
    ]);
  });
  it('chunkSize 5: three-year chunks from anchor', () => {
    expect(splitBy('2020-01-01', '2024-06-01', 5)).toEqual([
      { start: '2020-01-01', end: '2024-06-01' },
    ]);
  });
});

// ─── getPeriodRange ───────────────────────────────────────────────────────────

describe('getPeriodRange', () => {
  it('day mode: spans one UTC date-only calendar day', () => {
    const [start, end] = getPeriodRange({ mode: 'day', date: '2026-03-15' }) as [number, number];
    expect(start).toBe(Date.UTC(2026, 2, 15) / 1000);
    expect(end).toBe(Date.UTC(2026, 2, 16) / 1000);
  });

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

  it('week mode: spans exactly 7 UTC date-only days', () => {
    const [start, end] = getPeriodRange({ mode: 'week', year: 2026, week: 10 }) as [number, number];
    const days = (end - start) / 86400;
    expect(days).toBe(7);
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
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 2, 15, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('today mode: previous period becomes yesterday as a fixed day', () => {
    expect(navigatePeriod({ mode: 'today' }, -1)).toEqual({ mode: 'day', date: '2026-03-14' });
  });

  it('today mode: next period becomes tomorrow as a fixed day', () => {
    expect(navigatePeriod({ mode: 'today' }, 1)).toEqual({ mode: 'day', date: '2026-03-16' });
  });

  it('day mode: increments by one calendar day', () => {
    expect(navigatePeriod({ mode: 'day', date: '2026-03-15' }, 1)).toEqual({ mode: 'day', date: '2026-03-16' });
  });

  it('day mode: decrements by one calendar day', () => {
    expect(navigatePeriod({ mode: 'day', date: '2026-03-15' }, -1)).toEqual({ mode: 'day', date: '2026-03-14' });
  });

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
  it('day mode: scales down to a one-day budget', () => {
    const result = scaleBudgetForPeriod(310_000, { mode: 'day', date: '2026-03-15' });
    expect(result).toBe(10_000);
  });

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

// ─── findClosestDateBinary ───────────────────────────────────────────────────

const DAY = 86400;

describe('findClosestDateBinary', () => {
  const tolerance = 7 * DAY;

  it('returns undefined for empty array', () => {
    expect(findClosestDateBinary([], 100, tolerance)).toBeUndefined();
  });

  it('finds exact match', () => {
    const dates = [10 * DAY, 20 * DAY, 30 * DAY];
    expect(findClosestDateBinary(dates, 20 * DAY, tolerance)).toBe(20 * DAY);
  });

  it('finds closest date before target', () => {
    const dates = [10 * DAY, 20 * DAY, 30 * DAY];
    expect(findClosestDateBinary(dates, 21 * DAY, tolerance)).toBe(20 * DAY);
  });

  it('finds closest date after target', () => {
    const dates = [10 * DAY, 20 * DAY, 30 * DAY];
    expect(findClosestDateBinary(dates, 19 * DAY, tolerance)).toBe(20 * DAY);
  });

  it('ties resolve to earlier date', () => {
    const dates = [10 * DAY, 20 * DAY];
    expect(findClosestDateBinary(dates, 15 * DAY, tolerance)).toBe(10 * DAY);
  });

  it('returns undefined when closest exceeds tolerance', () => {
    const dates = [10 * DAY];
    expect(findClosestDateBinary(dates, 20 * DAY, 3 * DAY)).toBeUndefined();
  });

  it('returns match at exact tolerance boundary', () => {
    const dates = [10 * DAY];
    expect(findClosestDateBinary(dates, 17 * DAY, 7 * DAY)).toBe(10 * DAY);
  });

  it('returns undefined one second past tolerance', () => {
    const dates = [10 * DAY];
    expect(findClosestDateBinary(dates, 17 * DAY + 1, 7 * DAY)).toBeUndefined();
  });

  it('single element array — target before', () => {
    const dates = [20 * DAY];
    expect(findClosestDateBinary(dates, 18 * DAY, tolerance)).toBe(20 * DAY);
  });

  it('single element array — target after', () => {
    const dates = [20 * DAY];
    expect(findClosestDateBinary(dates, 22 * DAY, tolerance)).toBe(20 * DAY);
  });

  it('target before all dates — picks first', () => {
    const dates = [10 * DAY, 20 * DAY, 30 * DAY];
    expect(findClosestDateBinary(dates, 8 * DAY, tolerance)).toBe(10 * DAY);
  });

  it('target after all dates — picks last', () => {
    const dates = [10 * DAY, 20 * DAY, 30 * DAY];
    expect(findClosestDateBinary(dates, 32 * DAY, tolerance)).toBe(30 * DAY);
  });
});
