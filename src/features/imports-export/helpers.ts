import type { Account } from '../accounts/types';
import type { Category } from '../categories/types';
import Fuse from 'fuse.js';
import { DEFAULT_CATEGORY_ID } from '@/config';

const AMPERSAND_PATTERN = /&/g;
const WHITESPACE_PATTERN = /\s+/g;

/** Normalize CSV/bank labels so "&" / spacing variants still match category names. */
function normalizeImportLabel(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(AMPERSAND_PATTERN, ' and ')
    .replace(WHITESPACE_PATTERN, ' ');
}

function categoryNamesMatch(a: string, b: string): boolean {
  return normalizeImportLabel(a) === normalizeImportLabel(b);
}

/**
 * Ordered rules: first matching rule wins. `needles` are tried in order against the
 * user's category names (exact name first, then substring, preferring longer names).
 */
const CATEGORY_IMPORT_RULES: readonly {
  readonly exact?: readonly string[];
  readonly includes?: readonly string[];
  readonly needles: readonly string[];
}[] = [
  // Utilities ↔ bills (and common bank phrasing)
  {
    includes: [
      'electric bill',
      'water bill',
      'sewer',
      'trash',
      'garbage',
      'internet bill',
      'broadband',
      'phone bill',
      'mobile bill',
      'cable tv',
      'utility bill',
    ],
    needles: ['utilities'],
  },
  {
    includes: ['bills and utilities', 'utilities and bills', 'home utilities'],
    needles: ['utilities', 'housing'],
  },
  {
    exact: ['bills', 'monthly bills', 'household bills', 'recurring bills', 'utilities', 'utility'],
    needles: ['utilities', 'housing', 'bills'],
  },
  // Food
  {
    exact: ['groceries', 'grocery', 'restaurants', 'restaurant', 'dining', 'food', 'takeout', 'coffee'],
    needles: ['food', 'dining', 'shopping'],
  },
  {
    includes: ['fast food', 'food delivery'],
    needles: ['food', 'dining'],
  },
  // Transport
  {
    exact: ['transport', 'uber', 'lyft', 'taxi', 'parking', 'toll', 'fuel', 'petrol', 'gasoline'],
    needles: ['transportation', 'transport', 'car'],
  },
  {
    includes: ['public transit', 'train ticket', 'bus fare'],
    needles: ['transportation', 'transport'],
  },
  // "Gas" is ambiguous: fuel vs utility — try fuel-related transport first, then utilities
  { exact: ['gas'], needles: ['transportation', 'transport', 'utilities'] },
  // Housing
  {
    exact: ['rent', 'mortgage', 'lease', 'hoa', 'home insurance', 'property tax'],
    needles: ['housing', 'rent'],
  },
  // Shopping / personal
  {
    exact: ['shopping', 'clothes', 'clothing', 'apparel', 'amazon', 'retail'],
    needles: ['shopping', 'personal care'],
  },
  {
    exact: ['pharmacy', 'drugstore'],
    needles: ['healthcare', 'shopping'],
  },
  // Health
  {
    exact: ['health', 'medical', 'doctor', 'dentist', 'hospital', 'copay'],
    needles: ['healthcare', 'health'],
  },
  { exact: ['gym', 'fitness'], needles: ['healthcare', 'personal care', 'subscriptions'] },
  // Entertainment / subscriptions
  {
    exact: ['entertainment', 'movies', 'games', 'hobbies'],
    needles: ['entertainment', 'shopping'],
  },
  {
    exact: ['streaming', 'netflix', 'spotify', 'subscription', 'subscriptions', 'saas', 'software'],
    needles: ['subscriptions', 'entertainment', 'shopping'],
  },
  // Education
  { exact: ['education', 'tuition', 'school', 'books', 'courses'], needles: ['education', 'school'] },
  // Personal care
  { exact: ['personal care', 'beauty', 'haircut', 'salon', 'cosmetics'], needles: ['personal care', 'shopping'] },
  // Income (common export labels)
  {
    exact: ['salary', 'wage', 'wages', 'paycheck', 'payroll', 'income'],
    needles: ['salary', 'other income', 'freelance'],
  },
  { exact: ['freelance', 'contractor', '1099'], needles: ['freelance', 'other income', 'salary'] },
  { exact: ['investment', 'dividend', 'interest income', 'capital gains'], needles: ['investment', 'other income'] },
];

function ruleMatches(normalizedImport: string, rule: (typeof CATEGORY_IMPORT_RULES)[number]): boolean {
  if (rule.exact !== undefined && rule.exact.includes(normalizedImport)) return true;
  for (const frag of rule.includes ?? []) {
    if (normalizedImport.includes(frag)) return true;
  }
  return false;
}

function findCategoryByNeedles(categories: Category[], needles: readonly string[]): Category | undefined {
  const lowered = categories.map((c) => ({ c, n: c.name.toLowerCase() }));

  for (const needle of needles) {
    const n = needle.toLowerCase();
    const exact = lowered.find((row) => row.n === n);
    if (exact) return exact.c;
  }

  for (const needle of needles) {
    const n = needle.toLowerCase();
    const candidates = lowered.filter(({ n: ln }) => ln.includes(n));
    if (candidates.length === 0) continue;
    candidates.sort((a, b) => b.c.name.length - a.c.name.length);
    return candidates[0].c;
  }

  return undefined;
}

/**
 * Fuzzy-match `text` against the user's category names using Fuse.js.
 * Only returns a result when the match score is ≤ 0.4 (≈ ≥60% similarity).
 */
function findCategoryByFuzzy(text: string, categories: Category[]): Category | undefined {
  if (!text || categories.length === 0) return undefined;
  const fuse = new Fuse(categories, {
    keys: ['name'],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 3,
  });
  return fuse.search(text)[0]?.item;
}

function normalizeAccountLabel(name: string): string {
  return name.trim().toLowerCase().replace(WHITESPACE_PATTERN, ' ');
}

/**
 * Find the best-matching account for a raw CSV account name.
 * Tries exact match first, then contains match (either direction).
 * Falls back to `fallbackId` when no match is found.
 */
export function matchAccountNameToId(
  name: string | undefined,
  accounts: Account[],
): string {
  if (!name || accounts.length === 0) return accounts[0]?.id;

  const normalized = normalizeAccountLabel(name);

  const exact = accounts.find((a) => normalizeAccountLabel(a.name) === normalized);
  if (exact) return exact.id;

  const contains = accounts.find((a) => {
    const accountName = normalizeAccountLabel(a.name);
    return accountName.includes(normalized) || normalized.includes(accountName);
  });
  if (contains) return contains.id;

  return accounts[0].id;
}

export function mapCategoryNameToId(
  name: string | undefined,
  categories: Category[],
  note?: string,
): string {
  if (!name) return categories[0]?.id ?? DEFAULT_CATEGORY_ID;

  const trimmed = name.trim();

  // Stage 1: exact match (case-insensitive, normalised)
  const direct = categories.find((c) => categoryNamesMatch(c.name, trimmed));
  if (direct) return direct.id;

  const normalized = normalizeImportLabel(trimmed);

  // Stage 2: rule-based matching
  for (const rule of CATEGORY_IMPORT_RULES) {
    if (!ruleMatches(normalized, rule)) continue;
    const hit = findCategoryByNeedles(categories, rule.needles);
    if (hit) return hit.id;
  }

  // Stage 3: fuzzy similarity — try category name first, then note as fallback signal
  const fuzzyHit = findCategoryByFuzzy(trimmed, categories)
    ?? (note ? findCategoryByFuzzy(note, categories) : undefined);
  if (fuzzyHit) return fuzzyHit.id;

  // Stage 4: exact normalised fallback
  const fallback = categories.find((c) => normalizeImportLabel(c.name) === normalized);
  return fallback?.id ?? categories[0]?.id ?? DEFAULT_CATEGORY_ID;
}
