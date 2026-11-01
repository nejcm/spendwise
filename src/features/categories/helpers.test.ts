import { DEFAULT_CATEGORY_ID } from '@/config';

import { fitsTransactionType } from './helpers';

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
