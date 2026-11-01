import { getCurrentMonthRange } from '@/lib/date/helpers';
import { createTestDb } from '@/test-utils/sqlite-db';

import {
  createTransaction,
  createTransactions,
  createTransfer,
  deleteTransaction,
  deleteTransactions,
  duplicateTransfer,
  getMonthSummary,
  getRecentTransactions,
  getTransactionById,
  getTransactions,
  getTransactionsSample,
  hasUserTransactions,
  isTransferInLeg,
  TRANSFER_LEG_ROUNDS_TO_ZERO,
  updateTransaction,
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

  it('returns undefined (void)', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db);

    const result = await deleteTransaction(db as any, 'txn_1');
    expect(result).toBeUndefined();
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

    expect((await getRecentTransactions(db as any, 10)).map((t) => t.id).sort()).toEqual([outId, 'legacy_in'].sort());
    expect((await getTransactionsSample(db as any, MAR_START, APR_START, { limit: 10 })).map((t) => t.id).sort()).toEqual([outId, 'legacy_in'].sort());
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
