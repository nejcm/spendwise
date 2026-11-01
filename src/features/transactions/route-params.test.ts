import type { PeriodSelection } from '@/lib/store/store';
import { buildTransactionsHref, formatPeriodParam, parsePeriodParam, parseTransactionsRouteSeed } from './route-params';

describe('parseTransactionsRouteSeed', () => {
  it('parses seeded filters and search', () => {
    expect(parseTransactionsRouteSeed({
      accountId: 'acc_1',
      categoryId: 'cat_1',
      search: ' coffee ',
      type: 'expense',
    })).toEqual({
      search: 'coffee',
      filters: {
        accountId: 'acc_1',
        categoryId: 'cat_1',
        type: 'expense',
      },
    });
  });

  it('ignores an invalid type and an invalid period', () => {
    expect(parseTransactionsRouteSeed({
      type: 'weird',
      period: 'month:2026-13',
    })).toEqual({
      search: '',
      filters: {
        accountId: null,
        categoryId: null,
        type: null,
      },
    });
  });

  it('uses the first value when params arrive as arrays', () => {
    expect(parseTransactionsRouteSeed({
      accountId: ['acc_1', 'acc_2'],
      search: ['rent', 'ignored'],
    })).toEqual({
      search: 'rent',
      filters: {
        accountId: 'acc_1',
        categoryId: null,
        type: null,
      },
    });
  });

  it('parses a period into the seed', () => {
    expect(parseTransactionsRouteSeed({ period: 'month:2026-10' }).periodSelection)
      .toEqual({ mode: 'month', year: 2026, month: 10 });
  });
});

describe('parsePeriodParam', () => {
  it.each([
    ['month:2026-10', { mode: 'month', year: 2026, month: 10 }],
    ['year:2026', { mode: 'year', year: 2026 }],
    ['week:2026-W43', { mode: 'week', year: 2026, week: 43 }],
    ['day:2026-10-24', { mode: 'day', date: '2026-10-24' }],
    ['custom:2026-10-01..2026-10-31', { mode: 'custom', startDate: '2026-10-01', endDate: '2026-10-31' }],
    ['all', { mode: 'all' }],
    ['today', { mode: 'today' }],
    ['this-week', { mode: 'this-week' }],
    ['this-month', { mode: 'this-month' }],
    ['this-year', { mode: 'this-year' }],
  ])('parses %s', (value: string, expected: PeriodSelection) => {
    expect(parsePeriodParam(value)).toEqual(expected);
  });

  it.each([
    undefined,
    '',
    'month',
    'month:2026-1',
    'month:2026-00',
    'year:abc',
    'week:2026-W54',
    'day:2026-02-30',
    'day:20261024',
    'custom:2026-10-31..2026-10-01',
    'custom:2026-10-01',
    'decade:2020',
  ])('ignores %p', (value: string | undefined) => {
    expect(parsePeriodParam(value)).toBeUndefined();
  });

  it('round-trips every encoded period', () => {
    const values = ['month:2026-01', 'year:2026', 'week:2026-W5', 'day:2026-10-24', 'custom:2026-10-01..2026-10-31', 'all', 'this-month'];
    for (const value of values) {
      expect(formatPeriodParam(parsePeriodParam(value)!)).toBe(value);
    }
  });
});

describe('buildTransactionsHref', () => {
  it('serialises only the set fields', () => {
    expect(buildTransactionsHref({
      categoryId: 'cat_1',
      accountId: null,
      search: '  ',
      type: 'expense',
      periodSelection: { mode: 'month', year: 2026, month: 10 },
    })).toEqual({
      pathname: '/transactions',
      params: { categoryId: 'cat_1', type: 'expense', period: 'month:2026-10' },
    });
  });

  it('produces params that parse back into the same seed', () => {
    const href = buildTransactionsHref({
      accountId: 'acc_1',
      search: 'rent',
      periodSelection: { mode: 'custom', startDate: '2026-10-01', endDate: '2026-10-31' },
    });
    expect(parseTransactionsRouteSeed(href.params)).toEqual({
      search: 'rent',
      filters: { accountId: 'acc_1', categoryId: null, type: null },
      periodSelection: { mode: 'custom', startDate: '2026-10-01', endDate: '2026-10-31' },
    });
  });
});
