import { buildMonthlyExpenseTrendModel } from './monthly-expense-trend';

const month = (month: string, expense: number) => ({ month, income: 0, expense });

describe('monthly expense trend model', () => {
  it('compares the current month with the previous month', () => {
    expect(buildMonthlyExpenseTrendModel([
      month('2026-06', 100_000),
      month('2026-07', 75_000),
    ])).toEqual({
      currentExpense: 75_000,
      direction: 'lower',
      percentage: 25,
    });
  });

  it('reports higher and unchanged spending', () => {
    expect(buildMonthlyExpenseTrendModel([
      month('2026-06', 80_000),
      month('2026-07', 100_000),
    ])).toMatchObject({ direction: 'higher', percentage: 25 });
    expect(buildMonthlyExpenseTrendModel([
      month('2026-06', 100_000),
      month('2026-07', 100_000),
    ])).toMatchObject({ direction: 'same', percentage: 0 });
  });

  it('does not calculate a percentage without previous spending', () => {
    expect(buildMonthlyExpenseTrendModel([
      month('2026-06', 0),
      month('2026-07', 100_000),
    ])).toEqual({
      currentExpense: 100_000,
      direction: 'unavailable',
      percentage: null,
    });
  });
});
