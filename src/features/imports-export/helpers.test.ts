import type { Category } from '../categories/types';
import { mapCategoryNameToId } from '@/features/imports-export/helpers';

function makeCategory(id: string, name: string): Category {
  return { id, name, icon: null, color: '#000000', budget: null, sort_order: 0, created_at: 0 };
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
    it('does NOT fuzzy-match "cafe" to "Coffee & Drinks" — falls through to _unknown', () => {
      expect(mapCategoryNameToId('cafe', CATEGORIES)).toBe('_unknown');
    });

    it('does NOT fuzzy-match "espresso" to "Coffee & Drinks" — no lexical overlap', () => {
      expect(mapCategoryNameToId('espresso', CATEGORIES)).toBe('_unknown');
    });

    it('falls through to _unknown when no category is a close enough match', () => {
      expect(mapCategoryNameToId('xyz123abc', CATEGORIES, 'qwerty zxcvbn noop')).toBe('_unknown');
    });
  });

  describe('edge cases', () => {
    it('returns _unknown for undefined name', () => {
      expect(mapCategoryNameToId(undefined, CATEGORIES)).toBe('_unknown');
    });

    it('returns _unknown for whitespace-only name', () => {
      expect(mapCategoryNameToId('   ', CATEGORIES)).toBe('_unknown');
    });

    it('returns _unknown when categories array is empty', () => {
      expect(mapCategoryNameToId('food', [])).toBe('_unknown');
    });

    it('works correctly without a note argument (backwards-compatible)', () => {
      expect(mapCategoryNameToId('salary', CATEGORIES)).toBe('salary-id');
    });
  });
});
