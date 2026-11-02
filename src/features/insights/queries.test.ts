import { createTestDb } from '@/test-utils/sqlite-db';

import {
  getActivityCount,
  getCategorySpendByRange,
  getMonthlyTrend,
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

  it('takes the category type from categories.kind and ignores adjustment rows', async () => {
    const db = await createTestDb();
    await db.execAsync(`
      INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR');
      INSERT INTO categories (id, name, color, kind, sort_order) VALUES ('cat_food', 'Food', '#f00', 'expense', 0), ('cat_salary', 'Salary', '#0f0', 'income', 1);
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, is_adjustment) VALUES
        ('t1', 'acc_1', 'cat_food', 'expense', 3000, 'EUR', 3000, 'EUR', ${MAR_15}, 0),
        ('t2', 'acc_1', 'cat_food', 'income', 5000, 'EUR', 5000, 'EUR', ${MAR_15}, 0),
        ('t3', 'acc_1', 'cat_salary', 'income', 4000, 'EUR', 4000, 'EUR', ${MAR_20}, 0),
        ('t4', 'acc_1', NULL, 'transfer', 90000, 'EUR', 90000, 'EUR', ${MAR_15}, 1);
    `);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    expect(rows).toMatchObject([
      { category_id: 'cat_food', category_type: 'expense', income_total: 5000, expense_total: 3000 },
      { category_id: 'cat_salary', category_type: 'income', income_total: 4000, expense_total: 0 },
    ]);
    expect(await getSummaryByRange(db as any, MAR_START, APR_START)).toEqual({ income: 9000, expense: 3000, balance: 6000 });
  });
});

describe('account filter', () => {
  it('limits summary, category spend and trend to the given accounts; an empty list matches nothing', async () => {
    const db = await createTestDb();
    await db.execAsync(`
      INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR'), ('acc_2', 'Card', 'checking', 'EUR');
      INSERT INTO categories (id, name, color, kind, sort_order) VALUES ('cat_food', 'Food', '#f00', 'expense', 0);
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date) VALUES
        ('t1', 'acc_1', 'cat_food', 'expense', 3000, 'EUR', 3000, 'EUR', ${MAR_15}),
        ('t2', 'acc_2', 'cat_food', 'expense', 7000, 'EUR', 7000, 'EUR', ${MAR_15});
    `);

    expect((await getSummaryByRange(db as any, MAR_START, APR_START, ['acc_1'])).expense).toBe(3000);
    expect((await getSummaryByRange(db as any, MAR_START, APR_START)).expense).toBe(10000);
    expect((await getCategorySpendByRange(db as any, MAR_START, APR_START, ['acc_2']))[0].expense_total).toBe(7000);
    expect((await getTrendByRange(db as any, MAR_START, APR_START, ['acc_1', 'acc_2']))[0].expense).toBe(10000);
    expect((await getSummaryByRange(db as any, undefined, undefined, [])).expense).toBe(0);
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

// ─── getMonthlyTrend ──────────────────────────────────────────────────────────

describe('getMonthlyTrend', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 4, 15));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads all requested months with one aggregate query and fills gaps', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([
      { month: '2026-03', income: 300000, expense: 120000 },
      { month: '2026-05', income: 500000, expense: 200000 },
    ]);

    const trend = await getMonthlyTrend(db as any, 3);

    expect(db.getAllAsync).toHaveBeenCalledTimes(1);
    expect(db.getFirstAsync).not.toHaveBeenCalled();
    expect(trend).toEqual([
      { month: '2026-03', income: 300000, expense: 120000 },
      { month: '2026-04', income: 0, expense: 0 },
      { month: '2026-05', income: 500000, expense: 200000 },
    ]);
  });
});

describe('getActivityCount', () => {
  it('counts income and expense across all time, without transfers or adjustments', async () => {
    const db = await createTestDb();
    expect(await getActivityCount(db as any)).toBe(0);
    await db.execAsync(`
      INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR'), ('acc_2', 'Savings', 'savings', 'EUR');
      INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date, transfer_id, is_adjustment) VALUES
        ('t1', 'acc_1', 'expense', 3000, 'EUR', 3000, 'EUR', ${MAR_15}, NULL, 0),
        ('t2', 'acc_1', 'income', 5000, 'EUR', 5000, 'EUR', 0, NULL, 0),
        ('t3', 'acc_1', 'income', 90000, 'EUR', 90000, 'EUR', ${MAR_15}, NULL, 1),
        ('t4', 'acc_1', 'transfer', -2000, 'EUR', -2000, 'EUR', ${MAR_20}, 'tr_1', 0),
        ('t5', 'acc_2', 'transfer', 2000, 'EUR', 2000, 'EUR', ${MAR_20}, 'tr_1', 0);
    `);
    expect(await getActivityCount(db as any)).toBe(2);
  });
});
