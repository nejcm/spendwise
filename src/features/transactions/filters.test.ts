import type { FilterState, TransactionWithCategory } from './types';
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filterTransactions,
  getActiveFilterChips,
  groupByDay,
  sortTransactions,
  summarizeTransactions,
} from './filters';

const OCT_30 = Math.floor(Date.UTC(2026, 9, 30) / 1000);
const OCT_31 = Math.floor(Date.UTC(2026, 9, 31) / 1000);

function tx(overrides: Partial<TransactionWithCategory>): TransactionWithCategory {
  return {
    id: 'tx',
    account_id: 'acc_main',
    category_id: 'cat_food',
    type: 'expense',
    amount: 1000,
    currency: 'EUR',
    baseAmount: 1000,
    baseCurrency: 'EUR',
    date: OCT_31,
    note: null,
    merchant_name: null,
    merchant_logo_slug: null,
    location: null,
    transfer_id: null,
    is_adjustment: 0,
    created_at: 0,
    updated_at: 0,
    account_name: 'Main checking',
    category_name: 'Eating out',
    category_icon: '🍽️',
    category_color: '#f07a5a',
    counter_account_id: null,
    counter_account_name: null,
    counter_account_icon: null,
    counter_amount: null,
    counter_currency: null,
    tags: [],
    ...overrides,
  };
}

const lunch = tx({ id: 'lunch', baseAmount: 1850, merchant_name: 'Lunch with Ana', created_at: 2 });
const salary = tx({ id: 'salary', type: 'income', category_id: 'cat_salary', baseAmount: 285000, date: OCT_30 });
const transferOut = tx({ id: 'out', type: 'transfer', category_id: null, amount: -50000, baseAmount: 50000, transfer_id: 'tr', counter_account_name: 'Emergency fund' });
const transferIn = tx({ id: 'in', type: 'transfer', category_id: null, account_id: 'acc_savings', amount: 50000, baseAmount: 50000, transfer_id: 'tr' });
const opening = tx({ id: 'opening', type: 'transfer', category_id: null, amount: 150000, baseAmount: 150000, is_adjustment: 1, date: OCT_30 });
const all = [lunch, salary, transferOut, transferIn, opening];

const ids = (rows: TransactionWithCategory[]) => rows.map((t) => t.id);
const withFilters = (patch: Partial<FilterState>) => ({ ...DEFAULT_FILTERS, ...patch });

describe('filterTransactions', () => {
  it('shows a transfer pair once without an account filter, and the leg per account with one', () => {
    expect(ids(filterTransactions(all, DEFAULT_FILTERS))).toEqual(['lunch', 'out', 'salary', 'opening']);
    expect(ids(filterTransactions(all, withFilters({ accountIds: ['acc_savings'] })))).toEqual(['in']);
    expect(ids(filterTransactions(all, withFilters({ accountIds: ['acc_main', 'acc_savings'] })))).toHaveLength(5);
  });

  it('keeps opening-balance adjustments out of the Transfers tab', () => {
    expect(ids(filterTransactions(all, withFilters({ type: 'transfer' })))).toEqual(['out']);
    expect(ids(filterTransactions(all, withFilters({ type: 'expense' })))).toEqual(['lunch']);
  });

  it('matches any selected category', () => {
    expect(ids(filterTransactions(all, withFilters({ categoryIds: ['cat_food', 'cat_salary'] })))).toEqual(['lunch', 'salary']);
  });

  it('bounds the absolute base amount inclusively', () => {
    expect(ids(filterTransactions(all, withFilters({ minAmount: 1850, maxAmount: 50000 })))).toEqual(['lunch', 'out']);
    expect(ids(filterTransactions(all, withFilters({ maxAmount: 1849 })))).toEqual([]);
  });

  it('searches merchant, note, category and counter account', () => {
    expect(ids(filterTransactions(all, DEFAULT_FILTERS, ' ANA '))).toEqual(['lunch']);
    expect(ids(filterTransactions(all, DEFAULT_FILTERS, 'emergency'))).toEqual(['out']);
  });
});

describe('sortTransactions', () => {
  const a = tx({ id: 'a', baseAmount: 500, date: OCT_31 });
  const b = tx({ id: 'b', baseAmount: 500, date: OCT_30 });
  const c = tx({ id: 'c', baseAmount: 900, date: OCT_30 });

  it('sorts by date, then amount, with a stable tie-breaker', () => {
    expect(ids(sortTransactions([b, c, a], 'newest'))).toEqual(['a', 'c', 'b']);
    expect(ids(sortTransactions([a, b, c], 'oldest'))).toEqual(['b', 'c', 'a']);
    expect(ids(sortTransactions([a, b, c], 'largest'))).toEqual(['c', 'a', 'b']);
    expect(ids(sortTransactions([c, b, a], 'smallest'))).toEqual(['a', 'b', 'c']);
  });
});

describe('summarizeTransactions', () => {
  it('counts only income and expense toward In / Out / Net', () => {
    expect(summarizeTransactions(all)).toEqual({ count: 5, income: 285000, expense: 1850, net: 283150 });
  });
});

describe('groupByDay', () => {
  it('nets income and expense per day and leaves transfer-only days without a total', () => {
    const groups = groupByDay(filterTransactions([lunch, salary, transferOut, opening], DEFAULT_FILTERS));
    expect(groups.map((g) => [g.day, g.total, ids(g.transactions)])).toEqual([
      [OCT_31, -1850, ['lunch', 'out']],
      [OCT_30, 285000, ['salary', 'opening']],
    ]);
    expect(groupByDay([transferOut])[0]!.total).toBeNull();
  });
});

describe('active filters', () => {
  const lookups = {
    accounts: [{ id: 'acc_main', name: 'Main checking', icon: '💳' }],
    categories: [{ id: 'cat_food', name: 'Eating out', icon: '🍽️' }],
  };
  const format = (cents: number) => `€${cents / 100}`;

  it('derives one chip per id plus one for the amount range, each removing only itself', () => {
    const filters = withFilters({ accountIds: ['acc_main'], categoryIds: ['cat_food', 'cat_gone'], minAmount: 1000 });
    const chips = getActiveFilterChips(filters, lookups, format);

    expect(chips.map((c) => [c.label, c.remove])).toEqual([
      ['Eating out', { categoryIds: ['cat_gone'] }],
      ['Main checking', { accountIds: [] }],
      ['From €10', { minAmount: null, maxAmount: null }],
    ]);
    expect(countActiveFilters(filters)).toBe(4);
    expect(countActiveFilters(withFilters({ type: 'income', sort: 'largest' }))).toBe(0);
  });

  it('labels each amount bound shape', () => {
    const label = (patch: Partial<FilterState>) => getActiveFilterChips(withFilters(patch), lookups, format)[0]!.label;
    expect(label({ maxAmount: 5000 })).toBe('Up to €50');
    expect(label({ minAmount: 1000, maxAmount: 5000 })).toBe('€10 – €50');
  });
});

describe('tag filters', () => {
  const lisbon = tx({ id: 'lisbon', tags: ['Lisbon', 'Work'] });
  const work = tx({ id: 'work', tags: ['work'] });
  const umlaut = tx({ id: 'umlaut', tags: ['Ärger'] });
  const plain = tx({ id: 'plain' });
  const rows = [lisbon, work, umlaut, plain];

  it('matches any selected tag, ASCII case-insensitively, combined with other filters', () => {
    expect(ids(filterTransactions(rows, withFilters({ tags: ['lisbon'] })))).toEqual(['lisbon']);
    expect(ids(filterTransactions(rows, withFilters({ tags: ['WORK'] }))).sort()).toEqual(['lisbon', 'work']);
    expect(ids(filterTransactions(rows, withFilters({ tags: ['Lisbon', 'Ärger'] }))).sort()).toEqual(['lisbon', 'umlaut']);
    expect(ids(filterTransactions(rows, withFilters({ tags: ['work'], type: 'income' })))).toEqual([]);
  });

  it('keeps non-ASCII case variants distinct', () => {
    expect(ids(filterTransactions(rows, withFilters({ tags: ['ärger'] })))).toEqual([]);
  });

  it('search matches tags', () => {
    expect(ids(filterTransactions(rows, DEFAULT_FILTERS, 'lisb'))).toEqual(['lisbon']);
    expect(ids(filterTransactions(rows, DEFAULT_FILTERS, ' ÄRGER '))).toEqual(['umlaut']);
    expect(ids(filterTransactions(rows, DEFAULT_FILTERS, 'ärger'))).toEqual([]);
    expect(ids(filterTransactions(rows, DEFAULT_FILTERS, 'Ärg'))).toEqual(['umlaut']);
  });

  it('adds one removable chip per tag and counts each', () => {
    const filters = withFilters({ tags: ['Lisbon', 'Work'] });
    const chips = getActiveFilterChips(filters, { accounts: [], categories: [] }, String);

    expect(chips.map((c) => [c.key, c.label, c.remove])).toEqual([
      ['tags:lisbon', 'Lisbon', { tags: ['Work'] }],
      ['tags:work', 'Work', { tags: ['Lisbon'] }],
    ]);
    expect(countActiveFilters(filters)).toBe(2);
  });
});
