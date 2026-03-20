import { createTestDb } from '@/test-utils/sqlite-db';

import {
  archiveAccount,
  createAccount,
  getAccounts,
  getAccountsWithBalance,
  getAccountsWithBalanceForMonth,
  getAccountsWithBalanceForRange,
  getTotalBalance,
  updateAccount,
} from './queries';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MAR_START = 1_772_323_200; // 2026-03-01 00:00 UTC
const APR_START = 1_774_915_200; // 2026-04-01 00:00 UTC
const MAR_MID = Math.floor(Date.UTC(2026, 2, 15) / 1000); // 2026-03-15 UTC (timezone-safe)
const APR_MID = Math.floor(Date.UTC(2026, 3, 15) / 1000); // 2026-04-15 UTC (timezone-safe)

async function seedAccount(
  db: Awaited<ReturnType<typeof createTestDb>>,
  overrides: Record<string, unknown> = {},
) {
  const row = {
    id: 'acc_1',
    name: 'Checking',
    type: 'checking',
    currency: 'EUR',
    is_archived: 0,
    sort_order: 0,
    ...overrides,
  };
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency, is_archived, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.id, row.name, row.type, row.currency, row.is_archived, row.sort_order],
  );
  return row;
}

async function seedTransaction(
  db: Awaited<ReturnType<typeof createTestDb>>,
  overrides: Record<string, unknown> = {},
) {
  const row = {
    id: 'txn_1',
    account_id: 'acc_1',
    category_id: null,
    type: 'expense',
    amount: 5000,
    currency: 'EUR',
    baseAmount: 5000,
    baseCurrency: 'EUR',
    date: MAR_MID,
    note: null,
    ...overrides,
  };
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.account_id, row.category_id, row.type, row.amount, row.currency, row.baseAmount, row.baseCurrency, row.date, row.note],
  );
  return row;
}

// ─── getAccounts ──────────────────────────────────────────────────────────────

describe('getAccounts', () => {
  it('returns non-archived accounts', async () => {
    const db = await createTestDb();
    await seedAccount(db);

    const result = await getAccounts(db as any);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('acc_1');
  });

  it('excludes archived accounts', async () => {
    const db = await createTestDb();
    await seedAccount(db, { is_archived: 1 });

    const result = await getAccounts(db as any);
    expect(result).toHaveLength(0);
  });

  it('orders by sort_order ascending', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_2', sort_order: 10 });
    await seedAccount(db, { id: 'acc_1', sort_order: 1 });

    const result = await getAccounts(db as any);
    expect(result[0].id).toBe('acc_1');
    expect(result[1].id).toBe('acc_2');
  });
});

// ─── getAccountsWithBalance ───────────────────────────────────────────────────

describe('getAccountsWithBalance', () => {
  it('income adds to balance, expense subtracts', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'income', amount: 100_000, baseAmount: 100_000 });
    await seedTransaction(db, { id: 'txn_2', type: 'expense', amount: 30_000, baseAmount: 30_000 });

    const result = await getAccountsWithBalance(db as any);
    expect(result[0].balance).toBe(70_000);
  });

  it('positive transfer adds, negative transfer subtracts', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'transfer', amount: 20_000, baseAmount: 20_000 });
    await seedTransaction(db, { id: 'txn_2', type: 'transfer', amount: -10_000, baseAmount: 10_000 });

    const result = await getAccountsWithBalance(db as any);
    expect(result[0].balance).toBe(10_000);
  });

  it('negative transfer: baseBalance subtracts baseAmount (no ABS applied)', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    // Outgoing transfer: amount is negative, baseAmount stored as positive absolute value
    await seedTransaction(db, { type: 'transfer', amount: -10_000, baseAmount: 10_000 });

    const result = await getAccountsWithBalance(db as any);
    // balance: ABS(-10_000) = 10_000 → 0 - 10_000 = -10_000
    expect(result[0].balance).toBe(-10_000);
    // baseBalance: t.baseAmount (no ABS) = 10_000 → 0 - 10_000 = -10_000
    expect(result[0].baseBalance).toBe(-10_000);
  });

  it('baseBalance uses baseAmount for multi-currency totals', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'income', amount: 10_000, currency: 'USD', baseAmount: 9_200, baseCurrency: 'EUR' });

    const result = await getAccountsWithBalance(db as any);
    expect(result[0].baseBalance).toBe(9_200);
  });

  it('account with no transactions has zero balance', async () => {
    const db = await createTestDb();
    await seedAccount(db);

    const result = await getAccountsWithBalance(db as any);
    expect(result[0].balance).toBe(0);
    expect(result[0].baseBalance).toBe(0);
  });
});

// ─── getAccountsWithBalanceForMonth ──────────────────────────────────────────

describe('getAccountsWithBalanceForMonth', () => {
  it('includes transactions within the month', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { type: 'income', amount: 50_000, baseAmount: 50_000, date: MAR_MID });

    const result = await getAccountsWithBalanceForMonth(db as any, '2026-03');
    expect(result[0].balance).toBe(50_000);
  });

  it('excludes transactions outside the month', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { type: 'income', amount: 50_000, baseAmount: 50_000, date: APR_MID });

    const result = await getAccountsWithBalanceForMonth(db as any, '2026-03');
    expect(result[0].balance).toBe(0);
  });
});

// ─── getAccountsWithBalanceForRange ──────────────────────────────────────────

describe('getAccountsWithBalanceForRange', () => {
  it('includes monthlyExpense field', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { type: 'expense', baseAmount: 20_000, date: MAR_MID });

    const result = await getAccountsWithBalanceForRange(db as any, MAR_START, APR_START);
    expect(result[0]).toHaveProperty('monthlyExpense');
    expect(result[0].monthlyExpense).toBe(20_000);
  });

  it('filters by date range', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'expense', baseAmount: 10_000, date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', type: 'expense', baseAmount: 10_000, date: APR_START + 100 });

    const result = await getAccountsWithBalanceForRange(db as any, MAR_START, APR_START);
    expect(result[0].monthlyExpense).toBe(10_000); // only March txn
  });

  it('balance and baseBalance are computed correctly for the range', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'income', amount: 100_000, baseAmount: 100_000, date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', type: 'expense', amount: 30_000, baseAmount: 30_000, date: MAR_MID });

    const result = await getAccountsWithBalanceForRange(db as any, MAR_START, APR_START);
    expect(result[0].balance).toBe(70_000);
    expect(result[0].baseBalance).toBe(70_000);
  });
});

// ─── getTotalBalance ──────────────────────────────────────────────────────────

describe('getTotalBalance', () => {
  it('sums baseBalance across all accounts', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_1' });
    await seedAccount(db, { id: 'acc_2', sort_order: 1 });
    await seedTransaction(db, { id: 'txn_1', account_id: 'acc_1', type: 'income', baseAmount: 100_000 });
    await seedTransaction(db, { id: 'txn_2', account_id: 'acc_2', type: 'income', baseAmount: 50_000 });

    const result = await getTotalBalance(db as any);
    expect(result).toBe(150_000);
  });

  it('returns 0 when there are no transactions', async () => {
    const db = await createTestDb();
    await seedAccount(db);

    const result = await getTotalBalance(db as any);
    expect(result).toBe(0);
  });

  it('with yearMonth: only counts transactions in that month', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'income', baseAmount: 100_000, date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', type: 'income', baseAmount: 50_000, date: APR_MID });

    const result = await getTotalBalance(db as any, '2026-03');
    expect(result).toBe(100_000);
  });

  it('excludes archived accounts from the total', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_1', is_archived: 0 });
    await seedAccount(db, { id: 'acc_2', is_archived: 1, sort_order: 1 });
    await seedTransaction(db, { id: 'txn_1', account_id: 'acc_1', type: 'income', baseAmount: 100_000 });
    await seedTransaction(db, { id: 'txn_2', account_id: 'acc_2', type: 'income', baseAmount: 50_000 });

    const result = await getTotalBalance(db as any);
    expect(result).toBe(100_000);
  });
});

// ─── createAccount ────────────────────────────────────────────────────────────

describe('createAccount', () => {
  it('inserts and returns an id', async () => {
    const db = await createTestDb();

    const id = await createAccount(db as any, {
      name: 'Savings',
      description: 'Main savings',
      type: 'savings',
      currency: 'EUR',
      budget: '500',
      icon: 'piggy-bank',
      color: '#00FF00',
    });

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    const accounts = await getAccounts(db as any);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Savings');
  });

  it('converts budget string to cents', async () => {
    const db = await createTestDb();

    await createAccount(db as any, {
      name: 'Wallet',
      description: null,
      type: 'cash',
      currency: 'EUR',
      budget: '100.50',
      icon: 'wallet',
      color: '#AAAAAA',
    });

    const row = await db.getFirstAsync<{ budget: number }>(
      `SELECT budget FROM accounts LIMIT 1`,
    );
    expect(row!.budget).toBe(10050);
  });

  it('stores null description when not provided', async () => {
    const db = await createTestDb();

    await createAccount(db as any, {
      name: 'Wallet',
      description: null,
      type: 'cash',
      currency: 'EUR',
      budget: null,
      icon: 'wallet',
      color: '#AAAAAA',
    });

    const row = await db.getFirstAsync<{ description: string | null }>(
      `SELECT description FROM accounts LIMIT 1`,
    );
    expect(row!.description).toBeNull();
  });
});

// ─── updateAccount ────────────────────────────────────────────────────────────

describe('updateAccount', () => {
  it('updates the account fields', async () => {
    const db = await createTestDb();
    await seedAccount(db);

    await updateAccount(db as any, 'acc_1', {
      name: 'Updated',
      description: null,
      type: 'checking',
      currency: 'USD',
      budget: '200',
      icon: 'bank',
      color: '#FF0000',
    });

    const accounts = await getAccounts(db as any);
    expect(accounts[0].name).toBe('Updated');
    expect(accounts[0].currency).toBe('USD');
  });

  it('converts budget to cents', async () => {
    const db = await createTestDb();
    await seedAccount(db);

    await updateAccount(db as any, 'acc_1', {
      name: 'Card',
      description: null,
      type: 'credit_card',
      currency: 'EUR',
      budget: '250.75',
      icon: 'card',
      color: '#333333',
    });

    const row = await db.getFirstAsync<{ budget: number }>(
      `SELECT budget FROM accounts WHERE id = 'acc_1'`,
    );
    expect(row!.budget).toBe(25075);
  });
});

// ─── archiveAccount ───────────────────────────────────────────────────────────

describe('archiveAccount', () => {
  it('sets is_archived = 1 and excludes from getAccounts', async () => {
    const db = await createTestDb();
    await seedAccount(db);

    await archiveAccount(db as any, 'acc_1');

    const accounts = await getAccounts(db as any);
    expect(accounts).toHaveLength(0);
  });

  it('returns undefined (void)', async () => {
    const db = await createTestDb();
    await seedAccount(db);

    const result = await archiveAccount(db as any, 'acc_1');
    expect(result).toBeUndefined();
  });
});
