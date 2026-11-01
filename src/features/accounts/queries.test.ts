import { todayUnix } from '@/features/formatting/helpers';
import { SEED_ACCOUNT_ID } from '@/lib/sqlite/seed';
import { createTestDb } from '@/test-utils/sqlite-db';

import {
  archiveAccount,
  createAccount,
  getAccounts,
  getAccountSummaryNativeByRange,
  getAccountsWithBalance,
  getAccountsWithBalanceForMonth,
  getAccountsWithBalanceForRange,
  getBalanceSeries,
  getTotalBalance,
  setupFirstAccount,
  updateAccount,
  updateAccountOrder,
} from './queries';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('@/features/currencies/queries', () => ({
  ...jest.requireActual<object>('@/features/currencies/queries'),
  getRatesForDate: jest.fn(async () => ({ GBP: 0.8, USD: 1.1 })),
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

  it('uses the persisted order for plain and balance queries', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_1', sort_order: 0 });
    await seedAccount(db, { id: 'acc_2', sort_order: 1 });

    await updateAccountOrder(db as any, [
      { id: 'acc_2', sort_order: 0 },
      { id: 'acc_1', sort_order: 1 },
    ]);

    const accounts = await getAccounts(db as any);
    const accountsWithBalance = await getAccountsWithBalance(db as any);
    expect(accounts.map((account) => account.id)).toEqual(['acc_2', 'acc_1']);
    expect(accountsWithBalance.map((account) => account.id)).toEqual(['acc_2', 'acc_1']);
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

  it('out leg with a negative baseAmount (after a currency recalculation) still subtracts', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { type: 'transfer', amount: -10_000, baseAmount: -10_000 });

    const [withBalance] = await getAccountsWithBalance(db as any);
    expect(withBalance.baseBalance).toBe(-10_000);
    expect((await getAccountsWithBalanceForMonth(db as any, '2026-03'))[0].baseBalance).toBe(-10_000);
    expect((await getAccountsWithBalanceForRange(db as any, MAR_START, APR_START))[0].baseBalance).toBe(-10_000);
    expect(await getTotalBalance(db as any)).toBe(-10_000);
  });

  it('a transfer pair nets to zero in the total balance', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_1' });
    await seedAccount(db, { id: 'acc_2', sort_order: 1 });
    await seedTransaction(db, { id: 'txn_out', account_id: 'acc_1', type: 'transfer', amount: -10_000, baseAmount: 10_000 });
    await seedTransaction(db, { id: 'txn_in', account_id: 'acc_2', type: 'transfer', amount: 10_000, baseAmount: 10_000 });

    const result = await getAccountsWithBalance(db as any);
    expect(result.map((a) => a.baseBalance)).toEqual([-10_000, 10_000]);
    expect(await getTotalBalance(db as any)).toBe(0);
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

describe('getBalanceSeries', () => {
  it('splits the balance into the opening total and per-date changes', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_1' });
    await seedAccount(db, { id: 'acc_2', sort_order: 1 });
    await seedTransaction(db, { id: 'feb', type: 'income', baseAmount: 100_000, date: MAR_START - 86_400 });
    await seedTransaction(db, { id: 'mar_a', type: 'expense', baseAmount: 3_000, date: MAR_MID });
    await seedTransaction(db, { id: 'mar_b', type: 'income', baseAmount: 1_000, date: MAR_MID });
    await seedTransaction(db, { id: 'out', account_id: 'acc_1', type: 'transfer', amount: -10_000, baseAmount: 10_000, date: MAR_MID + 86_400 });
    await seedTransaction(db, { id: 'in', account_id: 'acc_2', type: 'transfer', amount: 10_000, baseAmount: 10_000, date: MAR_MID + 86_400 });
    await seedTransaction(db, { id: 'apr', type: 'income', baseAmount: 9_999, date: APR_MID });

    expect(await getBalanceSeries(db as any, MAR_START, APR_START)).toEqual({
      opening: 100_000,
      deltas: [{ date: MAR_MID, delta: -2_000 }, { date: MAR_MID + 86_400, delta: 0 }],
    });
  });

  it('subtracts an out leg whose baseAmount went negative and excludes archived accounts', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_1' });
    await seedAccount(db, { id: 'acc_2', is_archived: 1, sort_order: 1 });
    await seedTransaction(db, { id: 'out', type: 'transfer', amount: -10_000, baseAmount: -10_000, date: MAR_MID });
    await seedTransaction(db, { id: 'archived', account_id: 'acc_2', type: 'income', baseAmount: 50_000, date: MAR_START - 86_400 });

    expect(await getBalanceSeries(db as any, MAR_START, APR_START)).toEqual({
      opening: 0,
      deltas: [{ date: MAR_MID, delta: -10_000 }],
    });
  });
});

// ─── getAccountSummaryNativeByRange ───────────────────────────────────────────

describe('getAccountSummaryNativeByRange', () => {
  it('aggregates income and expense by native currency', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'income', amount: 10_000, currency: 'EUR', date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', type: 'expense', amount: 3000, currency: 'EUR', date: MAR_MID });
    await seedTransaction(db, { id: 'txn_3', type: 'income', amount: 5000, currency: 'USD', date: MAR_MID });

    const rows = await getAccountSummaryNativeByRange(db as any, 'acc_1', undefined, undefined);

    expect(rows).toEqual(expect.arrayContaining([
      { type: 'income', currency: 'EUR', total: 10_000 },
      { type: 'expense', currency: 'EUR', total: 3000 },
      { type: 'income', currency: 'USD', total: 5000 },
    ]));
    expect(rows).toHaveLength(3);
  });

  it('filters by date range', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'expense', amount: 1000, currency: 'EUR', date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', type: 'expense', amount: 2000, currency: 'EUR', date: APR_MID });

    const rows = await getAccountSummaryNativeByRange(db as any, 'acc_1', MAR_START, APR_START);

    expect(rows).toEqual([{ type: 'expense', currency: 'EUR', total: 1000 }]);
  });

  it('ignores transfers', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, { id: 'txn_1', type: 'transfer', amount: 5000, currency: 'EUR', date: MAR_MID });

    const rows = await getAccountSummaryNativeByRange(db as any, 'acc_1', undefined, undefined);

    expect(rows).toEqual([]);
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
    }, 'EUR');

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
    }, 'EUR');

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
    }, 'EUR');

    const row = await db.getFirstAsync<{ description: string | null }>(
      `SELECT description FROM accounts LIMIT 1`,
    );
    expect(row!.description).toBeNull();
  });

  it('appends after active and archived accounts', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_active', sort_order: 2 });
    await seedAccount(db, { id: 'acc_archived', is_archived: 1, sort_order: 8 });

    await createAccount(db as any, {
      name: 'New account',
      description: null,
      type: 'checking',
      currency: 'EUR',
      budget: null,
      icon: null,
      color: null,
    }, 'EUR');

    const row = await db.getFirstAsync<{ sort_order: number }>(
      `SELECT sort_order FROM accounts WHERE id = ?`,
      ['test-uuid-1234'],
    );
    expect(row!.sort_order).toBe(9);
  });

  const getAdjustments = (db: Awaited<ReturnType<typeof createTestDb>>) =>
    db.getAllAsync<{ account_id: string; type: string; category_id: string | null; transfer_id: string | null; is_adjustment: number; amount: number; currency: string; baseAmount: number; baseCurrency: string; date: number }>(
      'SELECT account_id, type, category_id, transfer_id, is_adjustment, amount, currency, baseAmount, baseCurrency, date FROM transactions',
    );
  const walletForm = { name: 'Wallet', description: null, type: 'cash' as const, currency: 'EUR' as const, budget: null, icon: null, color: null };

  it('writes no transaction without an opening balance', async () => {
    const db = await createTestDb();
    await createAccount(db as any, { ...walletForm, opening_balance: '0' }, 'EUR');
    expect(await getAdjustments(db)).toEqual([]);
  });

  it('adds a dated adjustment row that the balance queries count', async () => {
    const db = await createTestDb();
    const id = await createAccount(db as any, { ...walletForm, opening_balance: '1500.25' }, 'EUR');

    expect(await getAdjustments(db)).toEqual([{
      account_id: id,
      type: 'transfer',
      category_id: null,
      transfer_id: null,
      is_adjustment: 1,
      amount: 150025,
      currency: 'EUR',
      baseAmount: 150025,
      baseCurrency: 'EUR',
      date: todayUnix(),
    }]);
    expect((await getAccountsWithBalance(db as any))[0]).toMatchObject({ balance: 150025, baseBalance: 150025 });
    expect(await getTotalBalance(db as any)).toBe(150025);
  });

  it('keeps a negative opening balance signed and converts baseAmount as a positive value', async () => {
    const db = await createTestDb();
    await createAccount(db as any, { ...walletForm, currency: 'GBP', opening_balance: '-100' }, 'USD');

    expect(await getAdjustments(db)).toMatchObject([{ amount: -10000, currency: 'GBP', baseAmount: 13750, baseCurrency: 'USD' }]);
    expect((await getAccountsWithBalance(db as any))[0]).toMatchObject({ balance: -10000, baseBalance: -13750 });
  });
});

describe('updateAccountOrder', () => {
  it('persists every supplied position', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: 'acc_1', sort_order: 0 });
    await seedAccount(db, { id: 'acc_2', sort_order: 1 });
    await seedAccount(db, { id: 'acc_3', sort_order: 2 });

    await updateAccountOrder(db as any, [
      { id: 'acc_3', sort_order: 0 },
      { id: 'acc_1', sort_order: 1 },
      { id: 'acc_2', sort_order: 2 },
    ]);

    const rows = await db.getAllAsync<{ id: string; sort_order: number }>(
      `SELECT id, sort_order FROM accounts ORDER BY sort_order`,
    );
    expect(rows).toEqual([
      { id: 'acc_3', sort_order: 0 },
      { id: 'acc_1', sort_order: 1 },
      { id: 'acc_2', sort_order: 2 },
    ]);
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

// ─── setupFirstAccount ────────────────────────────────────────────────────────

describe('setupFirstAccount', () => {
  const data = { name: 'Wallet', icon: '👛', type: 'cash' as const, currency: 'GBP' as const };
  const getSeed = (db: Awaited<ReturnType<typeof createTestDb>>) =>
    db.getFirstAsync<{ name: string; icon: string | null; type: string; currency: string }>(
      'SELECT name, icon, type, currency FROM accounts WHERE id = ?',
      [SEED_ACCOUNT_ID],
    );

  it('rewrites the untouched seed account on Add', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: SEED_ACCOUNT_ID, name: 'Main Checking' });

    await setupFirstAccount(db as any, data, 'USD');

    expect(await getSeed(db)).toEqual({ name: 'Wallet', icon: '👛', type: 'cash', currency: 'GBP' });
    expect(await getAccounts(db as any)).toHaveLength(1);
  });

  it('only sets the preferred currency on Skip', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: SEED_ACCOUNT_ID, name: 'Main Checking' });

    await setupFirstAccount(db as any, null, 'USD');

    expect(await getSeed(db)).toMatchObject({ name: 'Main Checking', type: 'checking', currency: 'USD' });
  });

  it('leaves a seed account with transactions untouched and creates a new account on Add', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: SEED_ACCOUNT_ID, name: 'Main Checking' });
    await seedTransaction(db, { account_id: SEED_ACCOUNT_ID });

    await setupFirstAccount(db as any, data, 'USD');

    expect(await getSeed(db)).toMatchObject({ name: 'Main Checking', currency: 'EUR' });
    const accounts = await getAccounts(db as any);
    expect(accounts).toHaveLength(2);
    expect(accounts.find((a) => a.id !== SEED_ACCOUNT_ID)).toMatchObject({ name: 'Wallet', type: 'cash', currency: 'GBP' });
  });

  it('does nothing on Skip when the seed account has transactions', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: SEED_ACCOUNT_ID });
    await seedTransaction(db, { account_id: SEED_ACCOUNT_ID });

    await setupFirstAccount(db as any, null, 'USD');

    expect(await getSeed(db)).toMatchObject({ currency: 'EUR' });
    expect(await getAccounts(db as any)).toHaveLength(1);
  });

  it('creates a new account on Add when the seed account is missing', async () => {
    const db = await createTestDb();
    await seedAccount(db);

    await setupFirstAccount(db as any, data, 'USD');

    const accounts = await getAccounts(db as any);
    expect(accounts).toHaveLength(2);
    expect(accounts.find((a) => a.id !== 'acc_1')).toMatchObject({ name: 'Wallet', currency: 'GBP' });
  });

  it('does nothing on Skip when the seed account is missing', async () => {
    const db = await createTestDb();

    await setupFirstAccount(db as any, null, 'USD');

    expect(await getAccounts(db as any)).toHaveLength(0);
  });

  it('adds the opening balance to the rewritten seed account', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: SEED_ACCOUNT_ID, name: 'Main Checking' });

    await setupFirstAccount(db as any, { ...data, currency: 'USD', opening_balance: '250' }, 'USD');

    const rows = await db.getAllAsync<{ account_id: string; amount: number; is_adjustment: number }>('SELECT account_id, amount, is_adjustment FROM transactions');
    expect(rows).toEqual([{ account_id: SEED_ACCOUNT_ID, amount: 25000, is_adjustment: 1 }]);
  });

  it('writes no adjustment for a zero or empty opening balance', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: SEED_ACCOUNT_ID });

    await setupFirstAccount(db as any, { ...data, opening_balance: '' }, 'USD');

    expect(await db.getAllAsync('SELECT * FROM transactions')).toEqual([]);
  });

  it('never adds the opening balance to a seed account that already has transactions', async () => {
    const db = await createTestDb();
    await seedAccount(db, { id: SEED_ACCOUNT_ID });
    await seedTransaction(db, { account_id: SEED_ACCOUNT_ID });

    await setupFirstAccount(db as any, { ...data, currency: 'USD', opening_balance: '250' }, 'USD');

    const adjustments = await db.getAllAsync<{ account_id: string }>('SELECT account_id FROM transactions WHERE is_adjustment = 1');
    expect(adjustments).toHaveLength(1);
    expect(adjustments[0]!.account_id).not.toBe(SEED_ACCOUNT_ID);
  });
});
