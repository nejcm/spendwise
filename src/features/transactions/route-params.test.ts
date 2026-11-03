import type { FilterState } from './types';
import type { PeriodSelection } from '@/lib/store/store';
import { DEFAULT_FILTERS } from './filters';
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
      filters: { ...DEFAULT_FILTERS, accountIds: ['acc_1'], categoryIds: ['cat_1'], type: 'expense' },
    });
  });

  it('ignores an invalid type and an invalid period', () => {
    expect(parseTransactionsRouteSeed({
      type: 'weird',
      period: 'month:2026-13',
    })).toEqual({
      search: '',
      filters: DEFAULT_FILTERS,
    });
  });

  it('keeps every id when params arrive as arrays, and the first value otherwise', () => {
    expect(parseTransactionsRouteSeed({
      accountId: ['acc_1', 'acc_2'],
      search: ['rent', 'ignored'],
    })).toEqual({
      search: 'rent',
      filters: { ...DEFAULT_FILTERS, accountIds: ['acc_1', 'acc_2'] },
    });
  });

  it('parses comma-separated ids, sort and cent amounts', () => {
    expect(parseTransactionsRouteSeed({
      categoryId: 'cat_1, cat_2,,cat_1',
      sort: 'largest',
      minAmount: '1000',
      maxAmount: '5000',
    }).filters).toEqual({ ...DEFAULT_FILTERS, categoryIds: ['cat_1', 'cat_2'], sort: 'largest', minAmount: 1000, maxAmount: 5000 });
  });

  it('ignores an unknown sort and non-integer amounts', () => {
    expect(parseTransactionsRouteSeed({ sort: 'random', minAmount: '10.5', maxAmount: '-3' }).filters).toEqual(DEFAULT_FILTERS);
  });

  it('parses a period into the seed', () => {
    expect(parseTransactionsRouteSeed({ period: 'month:2026-10' }).periodSelection)
      .toEqual({ mode: 'month', year: 2026, month: 10 });
  });
});

describe('tags param', () => {
  const tagsOf = (tags: string | string[]) => parseTransactionsRouteSeed({ tags }).filters.tags;

  it('round-trips tags with commas as one JSON param', () => {
    const href = buildTransactionsHref({ tags: ['Travel, work'] });
    expect(href.params).toEqual({ tags: '["Travel, work"]' });
    expect(tagsOf(href.params.tags!)).toEqual(['Travel, work']);
  });

  it('normalizes, drops oversize and non-string entries and dedupes by tagKey', () => {
    expect(tagsOf(JSON.stringify([' Lisbon  trip ', 'lisbon TRIP', 'x'.repeat(41), 7, null, '', 'Ä', 'ä']))).toEqual(['Lisbon trip', 'Ä', 'ä']);
  });

  it('rejects junk and lists over the limit', () => {
    expect(tagsOf('Lisbon,Work')).toEqual([]);
    expect(tagsOf('{"a":1}')).toEqual([]);
    expect(tagsOf('"Lisbon"')).toEqual([]);
    expect(tagsOf(JSON.stringify(Array.from({ length: 21 }, (_, i) => `t${i}`)))).toEqual([]);
    expect(tagsOf(JSON.stringify(Array.from({ length: 20 }, (_, i) => `t${i}`)))).toHaveLength(20);
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
      categoryIds: ['cat_1'],
      accountIds: [],
      sort: 'newest',
      search: '  ',
      type: 'expense',
      periodSelection: { mode: 'month', year: 2026, month: 10 },
    })).toEqual({
      pathname: '/transactions',
      params: { categoryId: 'cat_1', type: 'expense', period: 'month:2026-10' },
    });
  });

  it('produces params that parse back into the same seed', () => {
    const filters: FilterState = { type: 'income', accountIds: ['acc_1', 'acc_2'], categoryIds: ['cat_1'], tags: ['Travel, work', 'Lisbon'], minAmount: 0, maxAmount: 2500, sort: 'oldest' };
    const href = buildTransactionsHref({
      ...filters,
      search: 'rent',
      periodSelection: { mode: 'custom', startDate: '2026-10-01', endDate: '2026-10-31' },
    });
    expect(parseTransactionsRouteSeed(href.params)).toEqual({
      search: 'rent',
      filters,
      periodSelection: { mode: 'custom', startDate: '2026-10-01', endDate: '2026-10-31' },
    });
  });
});
