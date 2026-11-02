import type { BudgetState } from './budget-state';
import { getBudgetState } from './budget-state';

describe('getBudgetState', () => {
  it.each([
    [500, 0, 'none'],
    [500, null, 'none'],
    [500, undefined, 'none'],
    [0, 10_000, 'normal'],
    [8_999, 10_000, 'normal'],
    [9_000, 10_000, 'warning'],
    [9_999, 10_000, 'warning'],
    [10_000, 10_000, 'normal'],
    [10_001, 10_000, 'over'],
  ])('spent %p of %p → %p', (spent: number, budget: number | null | undefined, expected: BudgetState) => {
    expect(getBudgetState(spent, budget)).toBe(expected);
  });
});
