import { BASE_SCHEMA, createTestDb } from '@/test-utils/sqlite-db';
import {
  getCategorySpendByRange,
  getSummaryByRange,
  getTrendByRange,
} from './queries';

function makeDb() {
  const db = createTestDb(BASE_SCHEMA);

  // Seed a default account and two categories
  db._raw.exec(`
    INSERT INTO accounts (id, name, type, currency) VALUES ('acc1', 'Cash', 'cash', 'EUR');

    INSERT INTO categories (id, name, color, sort_order) VALUES
      ('cat_food',   'Food',   '#FF0000', 0),
      ('cat_salary', 'Salary', '#00FF00', 1);
  `);

  return db;
}

/** Midnight UTC for a given ISO date string → unix seconds. */
function dayUnix(iso: string) {
  return Math.floor(new Date(iso).getTime() / 1000);
}

const MAR_START = dayUnix('2026-03-01');
const APR_START = dayUnix('2026-04-01');
const MAR_15 = dayUnix('2026-03-15');
const MAR_20 = dayUnix('2026-03-20');

// ─── getSummaryByRange ────────────────────────────────────────────────────────

describe('getSummaryByRange', () => {
  it('returns zeros when there are no transactions', async () => {
    const db = makeDb();
    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result).toEqual({ income: 0, expense: 0, balance: 0 });
  });

  it('sums income and expense using baseAmount', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES
        ('t1', 'acc1', 'cat_salary', 'income',  300000, 'EUR', 300000, 'EUR', ${MAR_15}),
        ('t2', 'acc1', 'cat_food',   'expense', 120000, 'EUR', 120000, 'EUR', ${MAR_20});
    `);

    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result.income).toBe(300000);
    expect(result.expense).toBe(120000);
    expect(result.balance).toBe(180000);
  });

  it('ignores transactions outside the range', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES
        ('t1', 'acc1', 'cat_food', 'expense', 50000, 'EUR', 50000, 'EUR', ${APR_START}),
        ('t2', 'acc1', 'cat_food', 'expense', 50000, 'EUR', 50000, 'EUR', ${MAR_START - 1});
    `);

    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result.expense).toBe(0);
  });

  it('ignores transfer transactions', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES ('t1', 'acc1', 'cat_food', 'transfer', 50000, 'EUR', 50000, 'EUR', ${MAR_15});
    `);

    // transfers are not filtered here (getSummaryByRange sums ALL types except …)
    // Actually the current query doesn't filter by type — only CASE WHEN distinguishes them.
    // Transfer rows go to neither income nor expense bucket → balance stays 0.
    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result.income).toBe(0);
    expect(result.expense).toBe(0);
  });

  it('uses baseAmount, not amount — multi-currency transactions', async () => {
    const db = makeDb();
    // Transaction in USD: amount = 10800 USD-cents, baseAmount = 10000 EUR-cents
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES ('t1', 'acc1', 'cat_food', 'expense', 10800, 'USD', 10000, 'EUR', ${MAR_15});
    `);

    const result = await getSummaryByRange(db as any, MAR_START, APR_START);
    expect(result.expense).toBe(10000); // baseAmount, not amount
  });
});

// ─── getCategorySpendByRange ──────────────────────────────────────────────────

describe('getCategorySpendByRange', () => {
  it('returns one row per category — no duplicate rows when a category has both types', async () => {
    const db = makeDb();
    // cat_food has both income and expense transactions
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES
        ('t1', 'acc1', 'cat_food', 'income',  5000, 'EUR', 5000, 'EUR', ${MAR_15}),
        ('t2', 'acc1', 'cat_food', 'expense', 3000, 'EUR', 3000, 'EUR', ${MAR_20});
    `);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const foodRows = rows.filter((r) => r.category_id === 'cat_food');
    expect(foodRows).toHaveLength(1); // must not be duplicated
  });

  it('correctly splits totals into income_total and expense_total', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES
        ('t1', 'acc1', 'cat_food', 'income',  5000, 'EUR', 5000, 'EUR', ${MAR_15}),
        ('t2', 'acc1', 'cat_food', 'expense', 3000, 'EUR', 3000, 'EUR', ${MAR_20});
    `);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    expect(food.income_total).toBe(5000);
    expect(food.expense_total).toBe(3000);
    expect(food.total).toBe(8000); // combined
  });

  it('sets category_type to income when income > expense', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES
        ('t1', 'acc1', 'cat_food', 'income',  9000, 'EUR', 9000, 'EUR', ${MAR_15}),
        ('t2', 'acc1', 'cat_food', 'expense', 3000, 'EUR', 3000, 'EUR', ${MAR_20});
    `);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    expect(food.category_type).toBe('income');
  });

  it('sets category_type to expense when expense >= income', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES ('t1', 'acc1', 'cat_food', 'expense', 5000, 'EUR', 5000, 'EUR', ${MAR_15});
    `);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    expect(food.category_type).toBe('expense');
  });

  it('returns total = 0 for categories with no transactions in range', async () => {
    const db = makeDb();
    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    expect(rows.every((r) => r.total === 0)).toBe(true);
  });

  it('calculates percentage of grand total', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES
        ('t1', 'acc1', 'cat_food',   'expense', 6000, 'EUR', 6000, 'EUR', ${MAR_15}),
        ('t2', 'acc1', 'cat_salary', 'income',  4000, 'EUR', 4000, 'EUR', ${MAR_20});
    `);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    const salary = rows.find((r) => r.category_id === 'cat_salary')!;
    expect(food.percentage).toBeCloseTo(60);
    expect(salary.percentage).toBeCloseTo(40);
  });

  it('excludes transactions outside the date range', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES
        ('t1', 'acc1', 'cat_food', 'expense', 5000, 'EUR', 5000, 'EUR', ${APR_START}),
        ('t2', 'acc1', 'cat_food', 'expense', 5000, 'EUR', 5000, 'EUR', ${MAR_START - 1});
    `);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    expect(food.total).toBe(0);
  });

  it('uses baseAmount not amount — multi-currency', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES ('t1', 'acc1', 'cat_food', 'expense', 10800, 'USD', 10000, 'EUR', ${MAR_15});
    `);

    const rows = await getCategorySpendByRange(db as any, MAR_START, APR_START);
    const food = rows.find((r) => r.category_id === 'cat_food')!;
    expect(food.expense_total).toBe(10000); // baseAmount, not amount
  });
});

// ─── getTrendByRange ──────────────────────────────────────────────────────────

describe('getTrendByRange', () => {
  it('returns daily income and expense grouped by date', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
      VALUES
        ('t1', 'acc1', 'cat_salary', 'income',  300000, 'EUR', 300000, 'EUR', ${MAR_15}),
        ('t2', 'acc1', 'cat_food',   'expense', 120000, 'EUR', 120000, 'EUR', ${MAR_15}),
        ('t3', 'acc1', 'cat_food',   'expense',  50000, 'EUR',  50000, 'EUR', ${MAR_20});
    `);

    const trend = await getTrendByRange(db as any, MAR_START, APR_START);
    const mar15 = trend.find((r) => r.date === MAR_15)!;
    const mar20 = trend.find((r) => r.date === MAR_20)!;

    expect(mar15.income).toBe(300000);
    expect(mar15.expense).toBe(120000);
    expect(mar20.expense).toBe(50000);
  });

  it('returns an empty array when no transactions exist in range', async () => {
    const db = makeDb();
    const trend = await getTrendByRange(db as any, MAR_START, APR_START);
    expect(trend).toEqual([]);
  });
});
