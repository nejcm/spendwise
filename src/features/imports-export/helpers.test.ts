import type { Account } from '../accounts/types';
import type { Category } from '../categories/types';
import type { ParsedRow } from './csv-parser';
import { flagDuplicates, formatFileSize, importDateRange, importRowToTransaction, mapCategoryNameToId, resolveImportRow } from '@/features/imports-export/helpers';

function makeCategory(id: string, name: string): Category {
  return { id, name, icon: null, color: '#000000', kind: 'expense', budget: null, sort_order: 0, created_at: 0 };
}

const CATEGORIES: Category[] = [
  makeCategory('food-id', 'Food & Dining'),
  makeCategory('transport-id', 'Transportation'),
  makeCategory('utilities-id', 'Utilities'),
  makeCategory('shopping-id', 'Shopping'),
  makeCategory('health-id', 'Healthcare'),
  makeCategory('entertainment-id', 'Entertainment'),
  makeCategory('salary-id', 'Salary'),
  makeCategory('coffee-id', 'Coffee & Drinks'),
];

describe('mapCategoryNameToId', () => {
  describe('stage 1 — exact match', () => {
    it('matches category name case-insensitively', () => {
      expect(mapCategoryNameToId('food & dining', CATEGORIES)).toBe('food-id');
    });

    it('normalises "&" to "and" before matching', () => {
      expect(mapCategoryNameToId('Food and Dining', CATEGORIES)).toBe('food-id');
    });

    it('matches Healthcare exactly', () => {
      expect(mapCategoryNameToId('Healthcare', CATEGORIES)).toBe('health-id');
    });
  });

  describe('stage 2 — rule-based match', () => {
    it('maps "uber" to Transportation', () => {
      // rule exact: ['uber', ...], needles: ['transportation', ...] — 'Transportation' is exact needle match
      expect(mapCategoryNameToId('uber', CATEGORIES)).toBe('transport-id');
    });

    it('maps "netflix" to Entertainment', () => {
      // rule exact: ['netflix', ...], needles: ['subscriptions', 'entertainment', ...] — 'Entertainment' exact needle match
      expect(mapCategoryNameToId('netflix', CATEGORIES)).toBe('entertainment-id');
    });

    it('maps "salary" to Salary', () => {
      // rule exact: ['salary', ...], needles: ['salary', ...]
      expect(mapCategoryNameToId('salary', CATEGORIES)).toBe('salary-id');
    });

    it('maps "doctor" to Healthcare', () => {
      // rule exact: ['doctor', ...], needles: ['healthcare', 'health'] — 'Healthcare' exact needle match
      expect(mapCategoryNameToId('doctor', CATEGORIES)).toBe('health-id');
    });
  });

  describe('stage 3 — fuzzy similarity', () => {
    it('fuzzy-matches a near-miss category name not covered by rules', () => {
      // 'Entertainmnt' doesn't match any rule; Fuse.js fuzzy-matches it to 'Entertainment'
      expect(mapCategoryNameToId('Entertainmnt', CATEGORIES)).toBe('entertainment-id');
    });

    it('fuzzy-matches a truncated category name', () => {
      // 'Utilites' is a common typo; not in any rule; fuzzy-matches 'Utilities'
      expect(mapCategoryNameToId('Utilites', CATEGORIES)).toBe('utilities-id');
    });

    it('uses note to fuzzy-match when category name has no close match', () => {
      // 'other' doesn't match any category; note 'Entertainmnt' is tried as fallback and fuzzy-matches 'Entertainment'
      const result = mapCategoryNameToId('other', CATEGORIES, 'Entertainmnt');
      expect(result).toBe('entertainment-id');
    });

    it('fuzzy-matches "coffe" (typo, missing char) to "Coffee & Drinks"', () => {
      expect(mapCategoryNameToId('coffe', CATEGORIES)).toBe('coffee-id');
    });

    it('fuzzy-matches "Coffe & Drinks" (one missing char) to "Coffee & Drinks"', () => {
      expect(mapCategoryNameToId('Coffe & Drinks', CATEGORIES)).toBe('coffee-id');
    });

    // "cafe" shares few characters with "coffee" — 1-char substitution (a→o) is not
    // close enough for Fuse.js at threshold 0.4. Semantic synonyms require a rule entry.
    it('does NOT fuzzy-match "cafe" to "Coffee & Drinks" — falls back to first category', () => {
      expect(mapCategoryNameToId('cafe', CATEGORIES)).toBe(CATEGORIES[0]!.id);
    });

    it('does NOT fuzzy-match "espresso" to "Coffee & Drinks" — falls back to first category', () => {
      expect(mapCategoryNameToId('espresso', CATEGORIES)).toBe(CATEGORIES[0]!.id);
    });

    it('falls back to first category when no match is found', () => {
      expect(mapCategoryNameToId('xyz123abc', CATEGORIES, 'qwerty zxcvbn noop')).toBe(CATEGORIES[0]!.id);
    });
  });

  describe('edge cases', () => {
    it('returns first category id for undefined name', () => {
      expect(mapCategoryNameToId(undefined, CATEGORIES)).toBe(CATEGORIES[0]!.id);
    });

    it('returns first category id for whitespace-only name', () => {
      expect(mapCategoryNameToId('   ', CATEGORIES)).toBe(CATEGORIES[0]!.id);
    });

    it('returns DEFAULT_CATEGORY_ID when categories array is empty', () => {
      expect(mapCategoryNameToId('food', [])).toBe('_unknown');
    });

    it('works correctly without a note argument (backwards-compatible)', () => {
      expect(mapCategoryNameToId('salary', CATEGORIES)).toBe('salary-id');
    });
  });
});

describe('formatFileSize', () => {
  it('shows whole KB below a megabyte, never 0', () => {
    expect(formatFileSize(10, 'stop')).toBe('1 KB');
    expect(formatFileSize(219_136, 'stop')).toBe('214 KB');
  });

  it('shows MB with one decimal in the number format', () => {
    expect(formatFileSize(1.5 * 1024 * 1024, 'comma')).toBe('1,5 MB');
  });
});

describe('flagDuplicates', () => {
  const accounts: Account[] = [
    { id: 'acc-1', name: 'Checking', description: null, type: 'checking', currency: 'EUR', icon: null, color: null, is_archived: 0, sort_order: 0, created_at: 0, updated_at: 0 },
    { id: 'acc-2', name: 'Savings', description: null, type: 'savings', currency: 'EUR', icon: null, color: null, is_archived: 0, sort_order: 1, created_at: 0, updated_at: 0 },
  ];
  const day = Date.UTC(2026, 2, 18) / 1000;
  const existing = [{ account_id: 'acc-1', type: 'expense' as const, amount: 1234, currency: 'EUR' as const, date: day }];

  function flag(rows: ParsedRow[], current = existing) {
    return flagDuplicates(rows, rows.map((r) => resolveImportRow(r, accounts, 'EUR')), current).map((r) => r.isDuplicate);
  }

  it('matches account, calendar day, absolute amount and type', () => {
    expect(flag([{ date: '2026-03-18', amount: -1234, note: 'Lunch', type: 'expense', accountName: 'Checking' }])).toEqual([true]);
  });

  it('ignores note and time of day', () => {
    expect(flag([{ date: '2026-03-18', amount: -1234, note: 'different', type: 'expense' }], [{ ...existing[0], date: day + 3600 }])).toEqual([true]);
  });

  it('does not match when account, day, amount or type differ', () => {
    expect(flag([
      { date: '2026-03-18', amount: -1234, note: '', type: 'expense', accountName: 'Savings' },
      { date: '2026-03-19', amount: -1234, note: '', type: 'expense' },
      { date: '2026-03-18', amount: -1235, note: '', type: 'expense' },
      { date: '2026-03-18', amount: 1234, note: '', type: 'income' },
      { date: '2026-03-18', amount: -1234, note: '', type: 'expense', currency: 'USD' },
    ])).toEqual([false, false, false, false, false]);
  });

  it('keeps rows with unparseable dates unflagged', () => {
    expect(flag([{ date: 'not a date', amount: -1234, note: '', type: 'expense' }])).toEqual([false]);
  });
});

describe('importRowToTransaction', () => {
  const accounts: Account[] = [
    { id: 'acc-1', name: 'Checking', description: null, type: 'checking', currency: 'EUR', icon: null, color: null, is_archived: 0, sort_order: 0, created_at: 0, updated_at: 0 },
  ];

  it('imports a transfer as an uncategorized signed leg', () => {
    expect(importRowToTransaction({ date: '2026-03-18', amount: -5000, note: 'To savings', type: 'transfer', categoryName: 'Food & Dining', accountName: 'Checking' }, accounts, CATEGORIES, 'EUR'))
      .toMatchObject({ account_id: 'acc-1', type: 'transfer', amount: -50, category_id: null });
  });

  it('categorizes income and expense rows', () => {
    expect(importRowToTransaction({ date: '2026-03-18', amount: -1234, note: '', type: 'expense', categoryName: 'Food & Dining' }, accounts, CATEGORIES, 'EUR'))
      .toMatchObject({ type: 'expense', amount: 12.34, category_id: 'food-id' });
  });
});

describe('importDateRange', () => {
  it('spans whole UTC days from the earliest to the latest row', () => {
    const start = Date.UTC(2026, 2, 18) / 1000;
    expect(importDateRange([
      { account_id: 'a', type: 'expense', amount: 1, currency: 'EUR', date: start + 86400 },
      { account_id: 'a', type: 'expense', amount: 1, currency: 'EUR', date: start },
      { account_id: 'a', type: 'expense', amount: 1, currency: 'EUR', date: Number.NaN },
    ])).toEqual([start, start + 2 * 86400]);
  });

  it('returns undefined without valid dates', () => {
    expect(importDateRange([])).toBeUndefined();
  });
});
