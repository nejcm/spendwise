import {
  getCategorySpendByRange,
  getSummaryByRange,
  getTrendByRange,
} from './queries';

function createMockDb() {
  return {
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
  };
}

const MAR_START = 1_772_323_200;
const APR_START = 1_774_915_200;
const MAR_15 = 1_773_532_800;
const MAR_20 = 1_773_964_800;

// ─── getSummaryByRange ────────────────────────────────────────────────────────

describe('getSummaryByRange', () => {
  it('returns zeros when there are no transactions', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValueOnce({ income: 0, expense: 0 });
    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result).toEqual({ income: 0, expense: 0, balance: 0 });
  });

  it('sums income and expense using baseAmount', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValueOnce({ income: 300_000, expense: 120_000 });

    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result.income).toBe(300000);
    expect(result.expense).toBe(120000);
    expect(result.balance).toBe(180000);
  });

  it('ignores transfer transactions', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValueOnce({ income: 0, expense: 0 });
    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result.income).toBe(0);
    expect(result.expense).toBe(0);
  });

  it('uses baseAmount, not amount — multi-currency transactions', async () => {
    const db = createMockDb();
    db.getFirstAsync.mockResolvedValueOnce({ income: 0, expense: 10_000 });

    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result.expense).toBe(10000); // baseAmount, not amount
  });
});

// ─── getCategorySpendByRange ──────────────────────────────────────────────────

describe('getCategorySpendByRange', () => {
  it('correctly splits totals into income_total and expense_total', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([{
      category_id: 'cat_food',
      category_name: 'Food',
      category_color: '#FF0000',
      category_icon: null,
      sort_order: 0,
      total: 8000,
      income_total: 5000,
      expense_total: 3000,
      category_type: 'income',
    }]);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    expect(food.income_total).toBe(5000);
    expect(food.expense_total).toBe(3000);
    expect(food.total).toBe(8000); // combined
  });

  it('returns total = 0 for categories with no transactions in range', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([{
      category_id: 'cat_food',
      category_name: 'Food',
      category_color: '#FF0000',
      category_icon: null,
      sort_order: 0,
      total: 0,
      income_total: 0,
      expense_total: 0,
      category_type: 'expense',
    }]);
    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    expect(rows.every((r) => r.total === 0)).toBe(true);
  });

  it('calculates percentage of grand total', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([
      {
        category_id: 'cat_food',
        category_name: 'Food',
        category_color: '#FF0000',
        category_icon: null,
        sort_order: 0,
        total: 6000,
        income_total: 0,
        expense_total: 6000,
        category_type: 'expense',
      },
      {
        category_id: 'cat_salary',
        category_name: 'Salary',
        category_color: '#00FF00',
        category_icon: null,
        sort_order: 1,
        total: 4000,
        income_total: 4000,
        expense_total: 0,
        category_type: 'income',
      },
    ]);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    const salary = rows.find((r) => r.category_id === 'cat_salary')!;
    expect(food.percentage).toBeCloseTo(60);
    expect(salary.percentage).toBeCloseTo(40);
  });

  it('uses baseAmount not amount — multi-currency', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([{
      category_id: 'cat_food',
      category_name: 'Food',
      category_color: '#FF0000',
      category_icon: null,
      sort_order: 0,
      total: 10000,
      income_total: 0,
      expense_total: 10000,
      category_type: 'expense',
    }]);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    expect(food.expense_total).toBe(10000); // baseAmount, not amount
  });
});

// ─── getTrendByRange ──────────────────────────────────────────────────────────

describe('getTrendByRange', () => {
  it('returns daily income and expense grouped by date', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([
      { date: MAR_15, income: 300000, expense: 120000 },
      { date: MAR_20, income: 0, expense: 50000 },
    ]);

    const trend = await getTrendByRange(db as any, MAR_START, APR_START);
    const mar15 = trend.find((r) => r.date === MAR_15)!;
    const mar20 = trend.find((r) => r.date === MAR_20)!;

    expect(mar15.income).toBe(300000);
    expect(mar15.expense).toBe(120000);
    expect(mar20.expense).toBe(50000);
  });

  it('returns an empty array when no transactions exist in range', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([]);
    const trend = await getTrendByRange(db as any, MAR_START, APR_START);
    expect(trend).toEqual([]);
  });
});
