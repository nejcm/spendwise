import { getCurrentMonthRange } from '@/lib/date/helpers';
import { createTestDb } from '@/test-utils/sqlite-db';

import {
  createTransaction,
  deleteTransaction,
  getMonthSummary,
  getRecentTransactions,
  getTransactionById,
  getTransactions,
  updateTransaction,
} from './queries';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MAR_START = 1_772_323_200; // 2026-03-01 00:00 UTC
const APR_START = 1_774_915_200; // 2026-04-01 00:00 UTC
const MAR_MID = Math.floor(Date.UTC(2026, 2, 15) / 1000); // 2026-03-15 UTC (timezone-safe)
const APR_MID = Math.floor(Date.UTC(2026, 3, 15) / 1000); // 2026-04-15 UTC (timezone-safe)

async function seedBase(db: Awaited<ReturnType<typeof createTestDb>>) {
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency) VALUES (?, ?, ?, ?)`,
    ['acc_1', 'Checking', 'checking', 'EUR'],
  );
  await db.runAsync(
    `INSERT INTO categories (id, name, color) VALUES (?, ?, ?)`,
    ['cat_1', 'Food', '#FF0000'],
  );
}

async function seedTransaction(
  db: Awaited<ReturnType<typeof createTestDb>>,
  overrides: Record<string, unknown> = {},
) {
  const row = {
    id: 'txn_1',
    account_id: 'acc_1',
    category_id: 'cat_1',
    type: 'expense',
    amount: 5000,
    currency: 'EUR',
    baseAmount: 5000,
    baseCurrency: 'EUR',
    date: MAR_MID,
    note: 'lunch',
    ...overrides,
  };
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.account_id, row.category_id, row.type, row.amount, row.currency, row.baseAmount, row.baseCurrency, row.date, row.note],
  );
  return row;
}

// ─── getTransactions ──────────────────────────────────────────────────────────

describe('getTransactions', () => {
  it('returns transactions in the given date range', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { date: MAR_MID });

    const result = await getTransactions(db as any, MAR_START, APR_START);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('txn_1');
  });

  it('excludes transactions outside the date range', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { date: APR_START + 1 }); // after range

    const result = await getTransactions(db as any, MAR_START, APR_START);
    expect(result).toHaveLength(0);
  });

  it('joins category fields', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);

    const result = await getTransactions(db as any, MAR_START, APR_START);
    expect(result[0].category_name).toBe('Food');
    expect(result[0].category_color).toBe('#FF0000');
  });

  it('includes a transaction at exactly startDate', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { date: MAR_START });

    const result = await getTransactions(db as any, MAR_START, APR_START);
    expect(result).toHaveLength(1);
  });

  it('excludes a transaction at exactly endDate', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { date: APR_START });

    const result = await getTransactions(db as any, MAR_START, APR_START);
    expect(result).toHaveLength(0);
  });

  it('returns null category fields when category_id is null', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { category_id: null });

    const result = await getTransactions(db as any, MAR_START, APR_START);
    expect(result[0].category_name).toBeNull();
    expect(result[0].category_color).toBeNull();
  });
});

// ─── getTransactionById ───────────────────────────────────────────────────────

describe('getTransactionById', () => {
  it('returns the transaction when found', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);

    const result = await getTransactionById(db as any, 'txn_1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('txn_1');
  });

  it('returns null when not found', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const result = await getTransactionById(db as any, 'missing');
    expect(result).toBeNull();
  });
});

// ─── getRecentTransactions ────────────────────────────────────────────────────

describe('getRecentTransactions', () => {
  it('returns up to the requested number of transactions', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1', date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', date: MAR_MID + 1 });
    await seedTransaction(db, { id: 'txn_3', date: MAR_MID + 2 });

    const result = await getRecentTransactions(db as any, 2);
    expect(result).toHaveLength(2);
  });

  it('orders by date descending', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1', date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', date: MAR_MID + 1000 });

    const result = await getRecentTransactions(db as any, 10);
    expect(result[0].id).toBe('txn_2');
    expect(result[1].id).toBe('txn_1');
  });
});

// ─── getMonthSummary ──────────────────────────────────────────────────────────

describe('getMonthSummary', () => {
  it('computes income, expense, and balance', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1', type: 'income', baseAmount: 200_000, date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', type: 'expense', baseAmount: 80_000, date: MAR_MID });

    const result = await getMonthSummary(db as any, '2026-03');
    expect(result.income).toBe(200_000);
    expect(result.expense).toBe(80_000);
    expect(result.balance).toBe(120_000);
  });

  it('returns zeros when no transactions exist', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const result = await getMonthSummary(db as any, '2026-03');
    expect(result).toEqual({ income: 0, expense: 0, balance: 0 });
  });

  it('excludes transactions outside the month', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1', type: 'income', baseAmount: 50_000, date: APR_MID });

    const result = await getMonthSummary(db as any, '2026-03');
    expect(result.income).toBe(0);
  });

  it('excludes transfers from income/expense totals', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1', type: 'transfer', baseAmount: 10_000, date: MAR_MID });

    const result = await getMonthSummary(db as any, '2026-03');
    expect(result.income).toBe(0);
    expect(result.expense).toBe(0);
  });

  it('includes a transaction at exactly startDate of the month', async () => {
    const db = await createTestDb();
    await seedBase(db);
    // Use the same boundary getCurrentMonthRange computes (local time) to stay timezone-safe
    const [startDate] = getCurrentMonthRange('2026-03');
    await seedTransaction(db, { type: 'income', baseAmount: 10_000, date: startDate });

    const result = await getMonthSummary(db as any, '2026-03');
    expect(result.income).toBe(10_000);
  });

  it('excludes a transaction at exactly the first moment of the next month', async () => {
    const db = await createTestDb();
    await seedBase(db);
    // Use the same boundary getCurrentMonthRange computes (local time) to stay timezone-safe
    const [, endDate] = getCurrentMonthRange('2026-03');
    await seedTransaction(db, { type: 'income', baseAmount: 10_000, date: endDate });

    const result = await getMonthSummary(db as any, '2026-03');
    expect(result.income).toBe(0);
  });
});

// ─── createTransaction ────────────────────────────────────────────────────────

describe('createTransaction', () => {
  it('inserts and returns an id', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const id = await createTransaction(db as any, {
      account_id: 'acc_1',
      category_id: 'cat_1',
      type: 'expense',
      amount: 5000,
      currency: 'EUR',
      baseAmount: 5000,
      baseCurrency: 'EUR',
      date: MAR_MID,
      note: 'lunch',
    });

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    const row = await getTransactionById(db as any, id);
    expect(row).not.toBeNull();
    expect(row!.amount).toBe(5000);
  });

  it('stores null note when note is empty', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const id = await createTransaction(db as any, {
      account_id: 'acc_1',
      category_id: 'cat_1',
      type: 'income',
      amount: 10_000,
      currency: 'USD',
      baseAmount: 9_200,
      baseCurrency: 'EUR',
      date: MAR_MID,
      note: '',
    });

    const row = await getTransactionById(db as any, id);
    expect(row!.note).toBeNull();
  });
});

// ─── updateTransaction ────────────────────────────────────────────────────────

describe('updateTransaction', () => {
  it('mutates the row in place', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { note: 'original' });

    await updateTransaction(db as any, 'txn_1', {
      account_id: 'acc_1',
      category_id: 'cat_1',
      type: 'expense',
      amount: 3000,
      currency: 'EUR',
      baseAmount: 3000,
      baseCurrency: 'EUR',
      date: MAR_MID,
      note: 'updated',
    });

    const row = await getTransactionById(db as any, 'txn_1');
    expect(row!.amount).toBe(3000);
    expect(row!.note).toBe('updated');
  });

  it('returns undefined (void)', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);

    const result = await updateTransaction(db as any, 'txn_1', {
      account_id: 'acc_1',
      category_id: 'cat_1',
      type: 'expense',
      amount: 1000,
      currency: 'EUR',
      baseAmount: 1000,
      baseCurrency: 'EUR',
      date: MAR_MID,
      note: null,
    });

    expect(result).toBeUndefined();
  });
});

// ─── deleteTransaction ────────────────────────────────────────────────────────

describe('deleteTransaction', () => {
  it('removes the row', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);

    await deleteTransaction(db as any, 'txn_1');

    const row = await getTransactionById(db as any, 'txn_1');
    expect(row).toBeNull();
  });

  it('returns undefined (void)', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);

    const result = await deleteTransaction(db as any, 'txn_1');
    expect(result).toBeUndefined();
  });
});
