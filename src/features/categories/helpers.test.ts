import { DEFAULT_CATEGORY_ID } from '@/config';

import { fitCategoryToType, fitsTransactionType } from './helpers';

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
