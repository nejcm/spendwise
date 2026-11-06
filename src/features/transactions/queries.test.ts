import { getCurrentMonthRange } from '@/lib/date/helpers';
import { createTestDb } from '@/test-utils/sqlite-db';

import {
  createTransaction,
  createTransactionFromForm,
  createTransactions,
  createTransfer,
  deleteTransaction,
  deleteTransactions,
  duplicateTransfer,
  getMonthSummary,
  getTagNames,
  getTransactionById,
  getTransactionMatchFields,
  getTransactions,
  getTransactionsSample,
  hasUserTransactions,
  isTransferInLeg,
  restoreTransaction,
  TRANSFER_LEG_ROUNDS_TO_ZERO,
  updateTransaction,
  updateTransactionFromForm,
  updateTransfer,
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
    merchant_name: null,
    merchant_logo_slug: null,
    location: null,
    ...overrides,
  };
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note, merchant_name, location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.account_id, row.category_id, row.type, row.amount, row.currency, row.baseAmount, row.baseCurrency, row.date, row.note, row.merchant_name, row.location],
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
    expect(result[0].account_name).toBe('Checking');
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

describe('hasUserTransactions', () => {
  it('ignores opening-balance adjustment rows', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date, is_adjustment)
       VALUES ('adj', 'acc_1', 'transfer', 1000, 'EUR', 1000, 'EUR', ?, 1)`,
      [MAR_MID],
    );
    expect(await hasUserTransactions(db as any)).toBe(false);

    await seedTransaction(db);
    expect(await hasUserTransactions(db as any)).toBe(true);
  });
});

describe('getTransactionMatchFields', () => {
  it('returns rows in the half-open range and skips opening-balance adjustments', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);
    await seedTransaction(db, { id: 'txn_apr', date: APR_START });
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date, is_adjustment)
       VALUES ('adj', 'acc_1', 'transfer', 1000, 'EUR', 1000, 'EUR', ?, 1)`,
      [MAR_MID],
    );
    expect(await getTransactionMatchFields(db as any, MAR_START, APR_START)).toEqual([
      { account_id: 'acc_1', type: 'expense', amount: 5000, currency: 'EUR', date: MAR_MID },
    ]);
  });
});

describe('getTransactionsSample', () => {
  it('returns rows within the requested date range up to the limit', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1', date: MAR_MID });
    await seedTransaction(db, { id: 'txn_2', date: MAR_MID + 1 });
    await seedTransaction(db, { id: 'txn_3', date: APR_MID });

    const result = await getTransactionsSample(db as any, MAR_START, APR_START, { limit: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('txn_2');
  });

  it('excludes rows outside the requested range', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1', date: APR_MID });

    const result = await getTransactionsSample(db as any, MAR_START, APR_START, { limit: 5 });

    expect(result).toHaveLength(0);
  });

  it('keeps only rows of the given accounts', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_2', 'Card', 'checking', 'EUR')`);
    await seedTransaction(db, { id: 'txn_1' });
    await seedTransaction(db, { id: 'txn_2', account_id: 'acc_2' });

    const result = await getTransactionsSample(db as any, MAR_START, APR_START, { limit: 5, accountIds: ['acc_2'] });

    expect(result.map((t) => t.id)).toEqual(['txn_2']);
  });

  it('keeps a transfer in-leg whose out-leg account is outside the scope, once per pair otherwise', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_2', 'Savings', 'savings', 'EUR')`);
    await seedTransaction(db, { id: 'out', type: 'transfer', amount: -5000, category_id: null });
    await seedTransaction(db, { id: 'in', account_id: 'acc_2', type: 'transfer', amount: 5000, category_id: null });
    await db.runAsync(`UPDATE transactions SET transfer_id = 'tr_1'`);

    const ids = async (accountIds?: string[]) =>
      (await getTransactionsSample(db as any, MAR_START, APR_START, { limit: 5, accountIds })).map((t) => t.id);

    expect(await ids(['acc_2'])).toEqual(['in']);
    expect(await ids(['acc_1'])).toEqual(['out']);
    expect(await ids(['acc_1', 'acc_2'])).toEqual(['out']);
    expect(await ids()).toEqual(['out']);
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
      merchant_name: null,
      merchant_logo_slug: null,
      location: null,
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
      merchant_name: null,
      merchant_logo_slug: null,
      location: null,
    });

    const row = await getTransactionById(db as any, id);
    expect(row!.note).toBeNull();
  });

  it('stores structured merchant and full location metadata', async () => {
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
      note: 'team lunch',
      merchant_name: 'Cafe Roma',
      merchant_logo_slug: null,
      location: 'Downtown branch, Berlin, DE',
    });

    const row = await getTransactionById(db as any, id);
    expect(row!.merchant_name).toBe('Cafe Roma');
    expect(row!.location).toBe('Downtown branch, Berlin, DE');
  });
});

// ─── createTransactions (multi-row INSERT) ────────────────────────────────────

describe('createTransactions', () => {
  const { randomUUID } = jest.requireMock<{ randomUUID: jest.Mock }>('expo-crypto');

  beforeEach(() => {
    let n = 0;
    randomUUID.mockImplementation(() => `batch-uuid-${n++}`);
  });

  afterEach(() => {
    randomUUID.mockImplementation(() => 'test-uuid-1234');
  });

  const baseRow = {
    account_id: 'acc_1',
    category_id: 'cat_1',
    type: 'expense' as const,
    amount: 1000,
    currency: 'EUR' as const,
    baseAmount: 1000,
    baseCurrency: 'EUR' as const,
    date: MAR_MID,
    note: 'x',
    merchant_name: null,
    merchant_logo_slug: null,
    location: null,
  };

  it('inserts multiple rows in one multi-value statement', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const ids = await createTransactions(db as any, [
      { ...baseRow, note: 'a', date: MAR_MID },
      { ...baseRow, note: 'b', date: MAR_MID + 1 },
    ]);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);

    const all = await getTransactions(db as any, MAR_START, APR_START);
    expect(all).toHaveLength(2);
  });

  it('chunks large imports across multiple INSERT statements', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const rows = Array.from({ length: 95 }, (_, i) => ({
      ...baseRow,
      note: `n${i}`,
      date: MAR_MID + i,
    }));

    const ids = await createTransactions(db as any, rows);
    expect(ids).toHaveLength(95);

    const all = await getTransactions(db as any, MAR_START, APR_START);
    expect(all).toHaveLength(95);
  });

  it('returns an empty array when the list is empty', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const ids = await createTransactions(db as any, []);
    expect(ids).toEqual([]);
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
      merchant_name: 'New Merchant',
      merchant_logo_slug: null,
      location: 'HQ, Munich, DE',
    });

    const row = await getTransactionById(db as any, 'txn_1');
    expect(row!.amount).toBe(3000);
    expect(row!.note).toBe('updated');
    expect(row!.merchant_name).toBe('New Merchant');
    expect(row!.location).toBe('HQ, Munich, DE');
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
      merchant_name: null,
      merchant_logo_slug: null,
      location: null,
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
});

describe('deleteTransaction undo', () => {
  type Db = Awaited<ReturnType<typeof createTestDb>>;
  const snapshot = (db: Db) => Promise.all([
    db.getAllAsync('SELECT * FROM transactions ORDER BY id'),
    db.getAllAsync('SELECT * FROM recurring_rule_runs ORDER BY id'),
  ]);

  async function roundTrip(db: Db, id: string) {
    await db.runAsync(`UPDATE transactions SET created_at = 111, updated_at = 222`);
    const before = await snapshot(db);
    const deleted = await deleteTransaction(db as any, id);
    expect(await snapshot(db)).not.toEqual(before);
    await restoreTransaction(db as any, deleted);
    expect(await snapshot(db)).toEqual(before);
    return deleted;
  }

  it('restores an expense unchanged', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { merchant_name: 'Cafe', location: 'Ljubljana' });

    expect((await roundTrip(db, 'txn_1')).transactions).toHaveLength(1);
  });

  it('restores both legs of a transfer', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_2', 'Savings', 'savings', 'EUR')`);
    await seedTransaction(db, { id: 'out', type: 'transfer', amount: -500, category_id: null });
    await seedTransaction(db, { id: 'in', type: 'transfer', amount: 500, category_id: null, account_id: 'acc_2' });
    await db.runAsync(`UPDATE transactions SET transfer_id = 'tr'`);

    expect((await roundTrip(db, 'in')).transactions.map((t) => t.id).sort()).toEqual(['in', 'out']);
  });

  it('restores an opening-balance adjustment', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { category_id: null, amount: 12345 });
    await db.runAsync(`UPDATE transactions SET is_adjustment = 1`);

    expect((await roundTrip(db, 'txn_1')).transactions[0]).toMatchObject({ is_adjustment: 1, amount: 12345 });
  });

  it('restores a rule-generated transaction with its run link', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);
    await db.execAsync(`
      INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date)
        VALUES ('rule', 'acc_1', 'expense', 5000, 'EUR', 'monthly', 100, 200);
      INSERT INTO recurring_rule_runs (id, rule_id, scheduled_for_date, transaction_id, created_at) VALUES ('run', 'rule', 100, 'txn_1', 333);
    `);

    expect((await roundTrip(db, 'txn_1')).runs).toEqual([expect.objectContaining({ id: 'run', created_at: 333 })]);
  });

  it('writes nothing when a referenced row is gone', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_2', 'Savings', 'savings', 'EUR')`);
    await seedTransaction(db, { id: 'out', type: 'transfer', amount: -500, category_id: null });
    await seedTransaction(db, { id: 'in', type: 'transfer', amount: 500, category_id: null, account_id: 'acc_2' });
    await db.runAsync(`UPDATE transactions SET transfer_id = 'tr'`);
    const deleted = await deleteTransaction(db as any, 'out');
    await db.runAsync(`DELETE FROM accounts WHERE id = 'acc_2'`);

    await expect(restoreTransaction(db as any, deleted)).rejects.toHaveProperty('code', 'SQLITE_CONSTRAINT_FOREIGNKEY');
    expect(await snapshot(db)).toEqual([[], []]);
  });
});

describe('deleteTransactions', () => {
  it('removes the selected rows and leaves the rest intact', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1' });
    await seedTransaction(db, { id: 'txn_2' });
    await seedTransaction(db, { id: 'txn_3' });

    await deleteTransactions(db as any, ['txn_1', 'txn_3']);

    expect(await getTransactionById(db as any, 'txn_1')).toBeNull();
    expect(await getTransactionById(db as any, 'txn_2')).not.toBeNull();
    expect(await getTransactionById(db as any, 'txn_3')).toBeNull();
  });

  it('does nothing for an empty selection', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);

    await expect(deleteTransactions(db as any, [])).resolves.toBeUndefined();
    expect(await getTransactionById(db as any, 'txn_1')).not.toBeNull();
  });
});

// ─── Transfers ────────────────────────────────────────────────────────────────

describe('transfer pairs', () => {
  const { randomUUID } = jest.requireMock<{ randomUUID: jest.Mock }>('expo-crypto');

  beforeEach(() => {
    let n = 0;
    randomUUID.mockImplementation(() => `uuid-${n++}`);
  });

  afterEach(() => {
    randomUUID.mockImplementation(() => 'test-uuid-1234');
  });

  async function seedAccounts(db: Awaited<ReturnType<typeof createTestDb>>) {
    await seedBase(db);
    await db.runAsync(
      `INSERT INTO accounts (id, name, type, currency, icon) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      ['acc_2', 'Savings', 'savings', 'EUR', '💰', 'acc_usd', 'Dollars', 'checking', 'USD', '💵'],
    );
  }

  const transfer = {
    account_id: 'acc_1',
    to_account_id: 'acc_2',
    category_id: null,
    amount: 5000,
    currency: 'EUR' as const,
    baseAmount: 5000,
    baseCurrency: 'EUR' as const,
    date: MAR_MID,
    note: 'to savings',
    merchant_name: null,
    merchant_logo_slug: null,
    location: null,
  };

  const legs = (db: Awaited<ReturnType<typeof createTestDb>>) => db.getAllAsync<Record<string, unknown>>(
    'SELECT id, account_id, type, amount, currency, baseAmount, transfer_id, is_adjustment FROM transactions ORDER BY amount',
  );

  it('createTransfer writes a negative out leg and positive in leg sharing a transfer_id', async () => {
    const db = await createTestDb();
    await seedAccounts(db);

    const outId = await createTransfer(db as any, transfer, {});

    const rows = await legs(db);
    expect(rows).toEqual([
      { id: outId, account_id: 'acc_1', type: 'transfer', amount: -5000, currency: 'EUR', baseAmount: 5000, transfer_id: rows[0]!.transfer_id, is_adjustment: 0 },
      { id: expect.any(String), account_id: 'acc_2', type: 'transfer', amount: 5000, currency: 'EUR', baseAmount: 5000, transfer_id: rows[0]!.transfer_id, is_adjustment: 0 },
    ]);
    expect(rows[0]!.transfer_id).toEqual(expect.any(String));
  });

  it('converts each leg into its own account currency', async () => {
    const db = await createTestDb();
    await seedAccounts(db);

    await createTransfer(db as any, { ...transfer, to_account_id: 'acc_usd' }, { USD: 1.1 });

    expect((await legs(db)).map((r) => [r.account_id, r.amount, r.currency, r.baseAmount])).toEqual([
      ['acc_1', -5000, 'EUR', 5000],
      ['acc_usd', 5500, 'USD', 5000],
    ]);
  });

  it('rejects a transfer whose converted leg rounds to zero, on create and update', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    const tiny = { ...transfer, to_account_id: 'acc_usd', amount: 1, baseAmount: 1 };

    await expect(createTransfer(db as any, tiny, { USD: 0.4 })).rejects.toThrow(TRANSFER_LEG_ROUNDS_TO_ZERO);
    expect(await legs(db)).toEqual([]);

    await createTransfer(db as any, transfer, {});
    const [out] = await legs(db);
    await expect(updateTransfer(db as any, out!.transfer_id as string, tiny, { USD: 0.4 })).rejects.toThrow(TRANSFER_LEG_ROUNDS_TO_ZERO);
    expect((await legs(db)).map((r) => r.amount)).toEqual([-5000, 5000]);
  });

  it('stores no category on either leg', async () => {
    const db = await createTestDb();
    await seedAccounts(db);

    await createTransfer(db as any, { ...transfer, category_id: 'cat_1' }, {});

    expect(await db.getAllAsync('SELECT category_id FROM transactions')).toEqual([{ category_id: null }, { category_id: null }]);
  });

  it('rejects a transfer to the same account', async () => {
    const db = await createTestDb();
    await seedAccounts(db);

    await expect(createTransfer(db as any, { ...transfer, to_account_id: 'acc_1' }, {}))
      .rejects
      .toHaveProperty('message', expect.stringMatching(/must differ/));
    expect(await legs(db)).toEqual([]);
  });

  it('reads expose the counter account on both legs; legacy legs have none', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    const outId = await createTransfer(db as any, transfer, {});
    await seedTransaction(db, { id: 'legacy', type: 'transfer', amount: -100, category_id: null });

    const out = await getTransactionById(db as any, outId);
    expect(out).toMatchObject({ counter_account_id: 'acc_2', counter_account_name: 'Savings', counter_account_icon: '💰', counter_amount: 5000, counter_currency: 'EUR' });

    const all = await getTransactions(db as any, MAR_START, APR_START);
    expect(all).toHaveLength(3);
    const inLeg = all.find((t) => t.account_id === 'acc_2')!;
    expect(inLeg).toMatchObject({ counter_account_id: 'acc_1', counter_account_name: 'Checking' });
    expect(isTransferInLeg(inLeg)).toBe(true);
    expect(isTransferInLeg(out!)).toBe(false);
    expect(all.find((t) => t.id === 'legacy')).toMatchObject({ counter_account_id: null, counter_account_name: null });
  });

  it('recent and AI sample lists show only the out leg of a pair', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    const outId = await createTransfer(db as any, transfer, {});
    await seedTransaction(db, { id: 'legacy_in', type: 'transfer', amount: 100, category_id: null });

    expect((await getTransactionsSample(db as any, MAR_START, APR_START, { limit: 10 })).map((t) => t.id).sort()).toEqual([outId, 'legacy_in'].sort());
  });

  it('list queries hide exactly the legs isTransferInLeg flags, zero-amount legs included', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    await createTransfer(db as any, transfer, {});
    await seedTransaction(db, { id: 'zero_a', type: 'transfer', amount: 0, baseAmount: 0, category_id: null });
    await seedTransaction(db, { id: 'zero_b', account_id: 'acc_2', type: 'transfer', amount: 0, baseAmount: 0, category_id: null });
    await db.runAsync(`UPDATE transactions SET transfer_id = 'zero_pair' WHERE id IN ('zero_a', 'zero_b')`);

    const all = await getTransactions(db as any, MAR_START, APR_START);
    const recent = await getTransactionsSample(db as any, MAR_START, APR_START, { limit: 10 });
    expect(recent.map((t) => t.id).sort()).toEqual(all.filter((t) => !isTransferInLeg(t)).map((t) => t.id).sort());
    expect(recent.map((t) => t.id)).toEqual(expect.arrayContaining(['zero_a', 'zero_b']));
  });

  it('transfers never count as income or expense', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    await createTransfer(db as any, transfer, {});

    expect(await getMonthSummary(db as any, '2026-03')).toEqual({ income: 0, expense: 0, balance: 0 });
  });

  it('updateTransfer rewrites both legs atomically, keeping ids and transfer_id', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    await createTransfer(db as any, transfer, {});
    const before = await legs(db);

    await updateTransfer(db as any, before[0]!.transfer_id as string, { ...transfer, to_account_id: 'acc_usd', amount: 2000, baseAmount: 2000, note: 'fx' }, { USD: 2 });

    const after = await legs(db);
    expect(after.map((r) => [r.id, r.account_id, r.amount, r.currency, r.baseAmount, r.transfer_id])).toEqual([
      [before[0]!.id, 'acc_1', -2000, 'EUR', 2000, before[0]!.transfer_id],
      [before[1]!.id, 'acc_usd', 4000, 'USD', 2000, before[0]!.transfer_id],
    ]);
  });

  it('deleteTransaction removes the paired leg too', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    await createTransfer(db as any, transfer, {});
    await seedTransaction(db, { id: 'keep' });
    const [, inLeg] = await legs(db);

    await deleteTransaction(db as any, inLeg!.id as string);

    expect((await legs(db)).map((r) => r.id)).toEqual(['keep']);
  });

  it('deleteTransactions expands pairs and leaves legacy legs alone', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    const outId = await createTransfer(db as any, transfer, {});
    await seedTransaction(db, { id: 'legacy', type: 'transfer', amount: -100, category_id: null });
    await seedTransaction(db, { id: 'legacy_2', type: 'transfer', amount: 100, category_id: null, account_id: 'acc_2' });

    await deleteTransactions(db as any, [outId, 'legacy']);

    expect((await legs(db)).map((r) => r.id)).toEqual(['legacy_2']);
  });

  it('duplicateTransfer copies both legs under a new transfer_id', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    await createTransfer(db as any, transfer, {});
    const [original] = await legs(db);

    const copyId = await duplicateTransfer(db as any, original!.transfer_id as string);

    const copy = await getTransactionById(db as any, copyId);
    expect(copy).toMatchObject({ account_id: 'acc_1', amount: -5000, note: 'to savings', counter_account_id: 'acc_2', counter_amount: 5000 });
    expect(copy!.transfer_id).not.toBe(original!.transfer_id);
    expect(await legs(db)).toHaveLength(4);
  });

  it('createTransaction and createTransactions persist transfer_id and is_adjustment, defaulting to null and 0', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    const base = { ...transfer, type: 'transfer' as const };

    await createTransaction(db as any, { ...base, is_adjustment: 1 });
    await createTransactions(db as any, [{ ...base, transfer_id: 'tr_x', amount: -1 }]);

    expect((await legs(db)).map((r) => [r.amount, r.transfer_id, r.is_adjustment])).toEqual([[-1, 'tr_x', 0], [5000, null, 1]]);
  });
});

describe('transaction tags', () => {
  type Db = Awaited<ReturnType<typeof createTestDb>>;
  const { randomUUID } = jest.requireMock<{ randomUUID: jest.Mock }>('expo-crypto');

  beforeEach(() => {
    let n = 0;
    randomUUID.mockImplementation(() => `tag-uuid-${n++}`);
  });

  afterEach(() => {
    randomUUID.mockImplementation(() => 'test-uuid-1234');
  });

  const row = {
    account_id: 'acc_1',
    category_id: 'cat_1',
    type: 'expense' as const,
    amount: 1000,
    currency: 'EUR' as const,
    baseAmount: 1000,
    baseCurrency: 'EUR' as const,
    date: MAR_MID,
    note: null,
    merchant_name: null,
    merchant_logo_slug: null,
    location: null,
  };

  const tagsOf = async (db: Db, id: string) => (await getTransactionById(db as any, id))!.tags;
  const tagRows = (db: Db) => db.getAllAsync('SELECT transaction_id, tag FROM transaction_tags ORDER BY transaction_id, tag');

  async function seedAccounts(db: Db) {
    await seedBase(db);
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_2', 'Savings', 'savings', 'EUR')`);
  }

  it('creates sorted, normalized tags and reads them on every list', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const id = await createTransaction(db as any, { ...row, tags: ['  Lisbon   trip ', 'z', 'Ä', ' ', 'lisbon trip'] });
    const expected = ['Ä', 'Lisbon trip', 'z'];

    expect(await db.getAllAsync('SELECT tag FROM transaction_tags')).not.toEqual(expected.map((tag) => ({ tag })));
    expect(await tagsOf(db, id)).toEqual(expected);
    expect((await getTransactions(db as any, MAR_START, APR_START))[0]!.tags).toEqual(expected);
    expect((await getTransactionsSample(db as any, MAR_START, APR_START, { limit: 5 }))[0]!.tags).toEqual(expected);
    expect(await tagsOf(db, await createTransaction(db as any, row))).toEqual([]);
  });

  it('update leaves tags untouched when omitted, replaces them when given and clears them with []', async () => {
    const db = await createTestDb();
    await seedBase(db);
    const id = await createTransaction(db as any, { ...row, tags: ['Lisbon'] });

    await updateTransaction(db as any, id, { ...row, note: 'edited' });
    expect(await tagsOf(db, id)).toEqual(['Lisbon']);

    await updateTransaction(db as any, id, { ...row, tags: ['Work', 'Porto'] });
    expect(await tagsOf(db, id)).toEqual(['Porto', 'Work']);

    await updateTransaction(db as any, id, { ...row, tags: [] });
    expect(await tagsOf(db, id)).toEqual([]);
  });

  it('keeps the stored spelling of an existing tag, also when a transaction re-tags itself', async () => {
    const db = await createTestDb();
    await seedBase(db);
    const a = await createTransaction(db as any, { ...row, tags: ['Lisbon'] });
    const b = await createTransaction(db as any, { ...row, tags: ['LISBON'] });
    expect(await tagsOf(db, b)).toEqual(['Lisbon']);

    await deleteTransactions(db as any, [b]);
    await updateTransaction(db as any, a, { ...row, tags: ['lisbon'] });
    expect(await tagsOf(db, a)).toEqual(['Lisbon']);
  });

  it('keeps commas, non-ASCII case variants and JSON-like text intact', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const id = await createTransaction(db as any, { ...row, tags: ['Travel, work', 'Ä', 'ä', '["x"]'] });

    const tags = await tagsOf(db, id);
    expect(tags).toHaveLength(4);
    expect(tags).toEqual(expect.arrayContaining(['Travel, work', 'Ä', 'ä', '["x"]']));
  });

  it('tags both transfer legs on create and update, and duplicateTransfer copies them', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    const transfer = { ...row, category_id: null, to_account_id: 'acc_2', tags: ['Lisbon'] };

    const outId = await createTransfer(db as any, transfer, {});
    const transferId = (await getTransactionById(db as any, outId))!.transfer_id!;
    expect((await tagRows(db)).map((r: any) => r.tag)).toEqual(['Lisbon', 'Lisbon']);

    await updateTransfer(db as any, transferId, { ...transfer, tags: ['Porto'] }, {});
    expect((await tagRows(db)).map((r: any) => r.tag)).toEqual(['Porto', 'Porto']);

    await updateTransfer(db as any, transferId, { ...transfer, tags: undefined }, {});
    const copyId = await duplicateTransfer(db as any, transferId);
    expect(await tagsOf(db, copyId)).toEqual(['Porto']);
    expect((await tagRows(db)).map((r: any) => r.tag)).toEqual(['Porto', 'Porto', 'Porto', 'Porto']);

    await updateTransfer(db as any, transferId, { ...transfer, tags: [] }, {});
    expect(await db.getAllAsync('SELECT tg.tag FROM transaction_tags tg JOIN transactions t ON t.id = tg.transaction_id WHERE t.transfer_id = ?', [transferId])).toEqual([]);
    expect(await tagRows(db)).toHaveLength(2);
  });

  it('createTransactions persists tags only for rows that carry them', async () => {
    const db = await createTestDb();
    await seedBase(db);

    const [tagged, plain] = await createTransactions(db as any, [{ ...row, tags: ['Lisbon', 'lisbon'] }, row]);

    expect(await tagsOf(db, tagged!)).toEqual(['Lisbon']);
    expect(await tagsOf(db, plain!)).toEqual([]);
  });

  it('undo restores deleted tags; bulk delete drops them by cascade', async () => {
    const db = await createTestDb();
    await seedAccounts(db);
    const outId = await createTransfer(db as any, { ...row, category_id: null, to_account_id: 'acc_2', tags: ['Lisbon', 'Work'] }, {});
    const before = await tagRows(db);

    const deleted = await deleteTransaction(db as any, outId);
    expect(deleted.tags).toHaveLength(4);
    expect(await tagRows(db)).toEqual([]);

    await restoreTransaction(db as any, deleted);
    expect(await tagRows(db)).toEqual(before);

    await deleteTransactions(db as any, [outId]);
    expect(await tagRows(db)).toEqual([]);
  });

  it('undo after the tag was reused with another casing keeps one spelling', async () => {
    const db = await createTestDb();
    await seedBase(db);
    const a = await createTransaction(db as any, { ...row, tags: ['Lisbon'] });
    const deleted = await deleteTransaction(db as any, a);
    await createTransaction(db as any, { ...row, tags: ['lisbon'] });

    await restoreTransaction(db as any, deleted);

    expect(await tagsOf(db, a)).toEqual(['lisbon']);
    expect(await getTagNames(db as any)).toEqual(['lisbon']);
  });

  it('getTagNames lists distinct tags by usage, then name', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await createTransaction(db as any, { ...row, tags: ['beta', 'Work'] });
    await createTransaction(db as any, { ...row, tags: ['work', 'alpha'] });
    await createTransaction(db as any, { ...row, tags: ['Alpha'] });

    expect(await getTagNames(db as any)).toEqual(['alpha', 'Work', 'beta']);
  });
});

describe('form writes', () => {
  const { randomUUID } = jest.requireMock<{ randomUUID: jest.Mock }>('expo-crypto');

  beforeEach(() => {
    let n = 0;
    randomUUID.mockImplementation(() => `uuid-${n++}`);
  });

  afterEach(() => {
    randomUUID.mockImplementation(() => 'test-uuid-1234');
  });

  const form = {
    account_id: 'acc_1',
    category_id: 'cat_1',
    type: 'expense' as const,
    amount: 12.34,
    currency: 'EUR' as const,
    date: MAR_MID,
    note: null,
    merchant_name: null,
    location: null,
  };

  async function seed() {
    const db = await createTestDb();
    await seedBase(db);
    await db.runAsync(
      `INSERT INTO accounts (id, name, type, currency) VALUES (?, ?, ?, ?)`,
      ['acc_2', 'Savings', 'savings', 'EUR'],
    );
    return db;
  }

  const rows = (db: Awaited<ReturnType<typeof createTestDb>>) => db.getAllAsync<Record<string, unknown>>(
    'SELECT account_id, type, amount, currency, baseAmount, baseCurrency, merchant_name, merchant_logo_slug, location, transfer_id FROM transactions ORDER BY amount',
  );

  it.each(['expense', 'income'] as const)('creates an %s in cents', async (type: 'expense' | 'income') => {
    const db = await seed();

    await createTransactionFromForm(db as any, { ...form, type }, undefined, 'EUR');

    expect(await rows(db)).toEqual([expect.objectContaining({ type, amount: 1234, baseAmount: 1234, baseCurrency: 'EUR' })]);
  });

  it('uses an explicit baseAmount over the rates', async () => {
    const db = await seed();

    await createTransactionFromForm(db as any, { ...form, currency: 'USD', baseAmount: 10 }, { USD: 2 }, 'EUR');

    expect((await rows(db))[0]).toMatchObject({ amount: 1234, currency: 'USD', baseAmount: 1000 });
  });

  it('computes a cross-currency baseAmount from the absolute amount', async () => {
    const db = await seed();

    await createTransactionFromForm(db as any, { ...form, amount: -10 }, { USD: 1.1 }, 'USD');

    expect((await rows(db))[0]).toMatchObject({ amount: -1000, baseAmount: 1100, baseCurrency: 'USD' });
  });

  it('stores a zero baseAmount for a zero amount', async () => {
    const db = await seed();

    await createTransactionFromForm(db as any, { ...form, amount: 0, baseAmount: 5 }, undefined, 'EUR');

    expect((await rows(db))[0]).toMatchObject({ amount: 0, baseAmount: 0 });
  });

  it('trims merchant and location and infers the logo slug', async () => {
    const db = await seed();

    await createTransactionFromForm(db as any, { ...form, merchant_name: '  Netflix.com ', location: ' Berlin ' }, undefined, 'EUR');

    expect((await rows(db))[0]).toMatchObject({ merchant_name: 'Netflix.com', merchant_logo_slug: 'netflix', location: 'Berlin' });
  });

  it('stores blank merchant and location as null', async () => {
    const db = await seed();

    await createTransactionFromForm(db as any, { ...form, merchant_name: '  ', location: ' ' }, undefined, 'EUR');

    expect((await rows(db))[0]).toMatchObject({ merchant_name: null, merchant_logo_slug: null, location: null });
  });

  it('creates and updates a transfer as a leg pair', async () => {
    const db = await seed();
    const transfer = { ...form, type: 'transfer' as const, category_id: null, to_account_id: 'acc_2' };

    const outId = await createTransactionFromForm(db as any, transfer, {}, 'EUR');
    await updateTransactionFromForm(db as any, { id: outId, data: { ...transfer, amount: 20 } }, {}, 'EUR');

    const legs = await rows(db);
    expect(legs.map((r) => [r.account_id, r.amount, r.baseAmount])).toEqual([['acc_1', -2000, 2000], ['acc_2', 2000, 2000]]);
    expect(legs[0]!.transfer_id).toEqual(expect.any(String));
    expect(legs[1]!.transfer_id).toBe(legs[0]!.transfer_id);
  });

  it('keeps the sign of a legacy single-leg transfer on update', async () => {
    const db = await seed();
    await seedTransaction(db, { id: 'legacy', type: 'transfer', amount: -5000, category_id: null });

    await updateTransactionFromForm(db as any, { id: 'legacy', data: { ...form, type: 'transfer', category_id: null, amount: 20 } }, {}, 'EUR');

    expect((await rows(db))[0]).toMatchObject({ type: 'transfer', amount: -2000, baseAmount: 2000, transfer_id: null });
  });

  it('creates a transfer without a counter account as a single row, without rates', async () => {
    const db = await seed();

    await createTransactionFromForm(db as any, { ...form, type: 'transfer', category_id: null, currency: 'USD', baseAmount: 10 }, undefined, 'EUR');

    expect(await rows(db)).toEqual([expect.objectContaining({ type: 'transfer', amount: 1234, baseAmount: 1000, transfer_id: null })]);
  });

  it('stores the signed amount of an opening balance on update', async () => {
    const db = await seed();
    await seedTransaction(db, { id: 'opening', type: 'transfer', amount: 5000, category_id: null });
    await db.runAsync('UPDATE transactions SET is_adjustment = 1');

    await updateTransactionFromForm(db as any, { id: 'opening', data: { ...form, type: 'transfer', category_id: null, amount: -20 } }, {}, 'EUR');

    expect((await rows(db))[0]).toMatchObject({ amount: -2000, baseAmount: 2000 });
  });

  it('updates an expense in place', async () => {
    const db = await seed();
    await seedTransaction(db);

    await updateTransactionFromForm(db as any, { id: 'txn_1', data: { ...form, amount: 7.5 } }, undefined, 'EUR');

    expect(await rows(db)).toEqual([expect.objectContaining({ amount: 750, baseAmount: 750 })]);
  });
});
