import { DEFAULT_CATEGORY_ID } from '@/config';

import { averageOfLast, buildMonthBars, firstFittingCategoryId, fitCategoryToType, fitsTransactionType, inKindTab, monthBarsRange, paletteColorName, rankMoveTargets, routeKind } from './helpers';

describe('fitsTransactionType', () => {
  const food = { id: 'cat_food', kind: 'expense' as const };
  const salary = { id: 'cat_salary', kind: 'income' as const };
  const unknown = { id: DEFAULT_CATEGORY_ID, kind: 'expense' as const };

  it('matches the category kind to the transaction type', () => {
    expect(fitsTransactionType(food, 'expense')).toBe(true);
    expect(fitsTransactionType(food, 'income')).toBe(false);
    expect(fitsTransactionType(salary, 'income')).toBe(true);
    expect(fitsTransactionType(salary, 'expense')).toBe(false);
  });

  it('keeps Uncategorised for both types and every category for transfers', () => {
    expect(fitsTransactionType(unknown, 'income')).toBe(true);
    expect(fitsTransactionType(salary, 'transfer')).toBe(true);
  });
});

describe('fitCategoryToType', () => {
  const categories = [{ id: 'cat_food', kind: 'expense' as const }, { id: 'cat_salary', kind: 'income' as const }];
  const remembered = { type: false, category: false };

  it('takes the type from a contradicting category when no type was given', () => {
    expect(fitCategoryToType({ type: 'expense', category_id: 'cat_salary' }, categories, remembered)).toEqual({ type: 'income', category_id: 'cat_salary' });
  });

  it('takes the type from a picked category over a remembered transfer', () => {
    expect(fitCategoryToType({ type: 'transfer', category_id: 'cat_salary' }, categories, { type: false, category: true })).toEqual({ type: 'income', category_id: 'cat_salary' });
  });

  it('drops a contradicting category when the type was given', () => {
    expect(fitCategoryToType({ type: 'expense', category_id: 'cat_salary' }, categories, { type: true, category: false })).toEqual({ type: 'expense', category_id: '' });
  });

  it('leaves fitting, unknown and remembered transfer values alone', () => {
    const fitting = { type: 'expense' as const, category_id: 'cat_food' };
    expect(fitCategoryToType(fitting, categories, { type: true, category: true })).toBe(fitting);
    const unknown = { type: 'income' as const, category_id: 'cat_gone' };
    expect(fitCategoryToType(unknown, categories, remembered)).toBe(unknown);
    const transfer = { type: 'transfer' as const, category_id: 'cat_salary' };
    expect(fitCategoryToType(transfer, categories, remembered)).toBe(transfer);
  });
});

describe('firstFittingCategoryId', () => {
  const categories = [{ id: 'cat_food', kind: 'expense' as const }, { id: 'cat_salary', kind: 'income' as const }];

  it('skips missing, unknown and other-kind ids', () => {
    expect(firstFittingCategoryId([undefined, 'cat_gone', 'cat_salary', 'cat_food'], categories, 'expense')).toBe('cat_food');
    expect(firstFittingCategoryId(['cat_food'], categories, 'income')).toBeUndefined();
  });
});

describe('rankMoveTargets', () => {
  const cat = (id: string, name: string, kind: 'expense' | 'income' = 'expense', sort_order = 0) => ({ id, name, kind, sort_order });
  const eating = cat('eat', 'Eating out');
  const all = [eating, cat('gro', 'Groceries', 'expense', 1), cat('go', 'Going out', 'expense', 2), cat('shop', 'Shopping', 'expense', 3), cat('sal', 'Salary', 'income'), cat(DEFAULT_CATEGORY_ID, 'Unknown')];

  it('puts shared name words first, then closest spending, same kind only', () => {
    const spend = { eat: 20000, gro: 40000, shop: 18000, go: 0 };
    expect(rankMoveTargets(eating, all, spend).map((c) => c.id)).toEqual(['go', 'shop', 'gro']);
  });

  it('falls back to sort order without spending data', () => {
    expect(rankMoveTargets(cat('x', 'Rent'), all, {}).map((c) => c.id)).toEqual(['eat', 'gro', 'go', 'shop']);
  });
});

describe('month bars', () => {
  it('zero-fills six calendar months ending with the given month, across a year boundary', () => {
    const bars = buildMonthBars([{ month: '2025-12', income: 0, expense: 500 }, { month: '2026-02', income: 9, expense: 300 }], '2026-02', 'expense');
    expect(bars.map((b) => [b.month, b.value])).toEqual([
      ['2025-09', 0],
      ['2025-10', 0],
      ['2025-11', 0],
      ['2025-12', 500],
      ['2026-01', 0],
      ['2026-02', 300],
    ]);
    expect(bars[0].start).toBe(Date.UTC(2025, 8, 1) / 1000);
    expect(monthBarsRange('2026-02')).toEqual([Date.UTC(2025, 8, 1) / 1000, Date.UTC(2026, 2, 1) / 1000]);
  });

  it('averages the last three months in whole cents', () => {
    expect(averageOfLast(buildMonthBars([
      { month: '2026-08', income: 0, expense: 22720 },
      { month: '2026-09', income: 0, expense: 17880 },
      { month: '2026-10', income: 0, expense: 23690 },
    ], '2026-10', 'expense'))).toBe(21430);
  });
});

describe('paletteColorName', () => {
  it('names palette colours by hue and shade', () => {
    expect(paletteColorName('#FB923C')).toEqual({ hue: 'orange', step: 400 });
    expect(paletteColorName('#831843')).toEqual({ hue: 'pink', step: 900 });
    expect(paletteColorName('#333333')).toBeNull();
  });
});

describe('inKindTab', () => {
  const spend = (category_id: string, category_type: 'expense' | 'income', expense_total: number, income_total: number) =>
    ({ category_id, category_type, expense_total, income_total }) as any;

  it('lists a category under its own kind and under any kind it has activity in', () => {
    const switched = spend('cat_food', 'income', 1000, 0);
    expect(inKindTab('expense', switched)).toBe(true);
    expect(inKindTab('income', switched)).toBe(true);
    const idle = spend('cat_food', 'expense', 0, 0);
    expect(inKindTab('expense', idle)).toBe(true);
    expect(inKindTab('income', idle)).toBe(false);
  });

  it('lists Uncategorised only where it has activity', () => {
    expect(inKindTab('expense', spend(DEFAULT_CATEGORY_ID, 'expense', 0, 200000))).toBe(false);
    expect(inKindTab('income', spend(DEFAULT_CATEGORY_ID, 'expense', 0, 200000))).toBe(true);
  });
});

describe('routeKind', () => {
  it('prefers a valid kind param and falls back to the stored kind', () => {
    expect(routeKind('income', 'expense')).toBe('income');
    expect(routeKind('transfer', 'income')).toBe('income');
    expect(routeKind(undefined, undefined)).toBe('expense');
  });
});
