import { createTestDb } from '@/test-utils/sqlite-db';

import { getGlobalBudget, getGlobalBudgetSpend, setGlobalBudget } from './global-budget-queries';

const JAN_START = Math.floor(Date.UTC(2026, 0, 1) / 1000);
const FEB_START = Math.floor(Date.UTC(2026, 1, 1) / 1000);
const JAN_MID = Math.floor(Date.UTC(2026, 0, 15) / 1000);

async function seedExpenseTransaction(
  db: Awaited<ReturnType<typeof createTestDb>>,
  overrides: Record<string, unknown> = {},
) {
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency, is_archived, sort_order)
     VALUES ('acc_1', 'Checking', 'checking', 'EUR', 0, 0)
     ON CONFLICT(id) DO NOTHING`,
    [],
  );
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date)
     VALUES (?, 'acc_1', 'expense', ?, 'EUR', ?, 'EUR', ?)`,
    [
      overrides.id ?? 'tx_1',
      overrides.amount ?? 5000,
      overrides.baseAmount ?? 5000,
      overrides.date ?? JAN_MID,
    ],
  );
}

// ─── getGlobalBudget ──────────────────────────────────────────────────────────

describe('getGlobalBudget', () => {
  it('returns null when no budget is set', async () => {
    const db = await createTestDb();
    expect(await getGlobalBudget(db as any)).toBeNull();
  });

  it('returns the stored budget with type', async () => {
    const db = await createTestDb();
    await setGlobalBudget(db as any, { amountCents: 300_000, type: 'monthly' });
    expect(await getGlobalBudget(db as any)).toEqual({ amountCents: 300_000, type: 'monthly' });
  });

  it('returns yearly budget with correct type', async () => {
    const db = await createTestDb();
    await setGlobalBudget(db as any, { amountCents: 1_200_000, type: 'yearly' });
    expect(await getGlobalBudget(db as any)).toEqual({ amountCents: 1_200_000, type: 'yearly' });
  });

  it('returns null after budget is cleared', async () => {
    const db = await createTestDb();
    await setGlobalBudget(db as any, { amountCents: 100_000, type: 'monthly' });
    await setGlobalBudget(db as any, null);
    expect(await getGlobalBudget(db as any)).toBeNull();
  });

  it('falls back to legacy key (global_monthly_budget) treating it as monthly', async () => {
    const db = await createTestDb();
    await db.runAsync(
      `INSERT INTO _meta (key, value) VALUES ('global_monthly_budget', '200000')`,
      [],
    );
    expect(await getGlobalBudget(db as any)).toEqual({ amountCents: 200_000, type: 'monthly' });
  });

  it('returns null for a malformed non-numeric value in legacy _meta key', async () => {
    const db = await createTestDb();
    await db.runAsync(
      `INSERT INTO _meta (key, value) VALUES ('global_monthly_budget', 'not-a-number')`,
      [],
    );
    expect(await getGlobalBudget(db as any)).toBeNull();
  });

  it('overwrites an existing value on update', async () => {
    const db = await createTestDb();
    await setGlobalBudget(db as any, { amountCents: 100_000, type: 'monthly' });
    await setGlobalBudget(db as any, { amountCents: 250_000, type: 'yearly' });
    expect(await getGlobalBudget(db as any)).toEqual({ amountCents: 250_000, type: 'yearly' });
  });
});

// ─── getGlobalBudgetSpend ─────────────────────────────────────────────────────

describe('getGlobalBudgetSpend', () => {
  it('returns 0 when there are no transactions', async () => {
    const db = await createTestDb();
    expect(await getGlobalBudgetSpend(db as any, JAN_START, FEB_START)).toBe(0);
  });

  it('sums expense baseAmounts within the period', async () => {
    const db = await createTestDb();
    await seedExpenseTransaction(db, { id: 'tx_1', baseAmount: 5000, date: JAN_MID });
    await seedExpenseTransaction(db, { id: 'tx_2', baseAmount: 3000, date: JAN_MID });
    expect(await getGlobalBudgetSpend(db as any, JAN_START, FEB_START)).toBe(8000);
  });

  it('excludes transactions outside the date range', async () => {
    const db = await createTestDb();
    await seedExpenseTransaction(db, { id: 'tx_1', baseAmount: 5000, date: JAN_MID });
    // FEB transaction — should be excluded from JAN range
    await seedExpenseTransaction(db, { id: 'tx_2', baseAmount: 9000, date: FEB_START + 1000 });
    expect(await getGlobalBudgetSpend(db as any, JAN_START, FEB_START)).toBe(5000);
  });

  it('excludes income transactions', async () => {
    const db = await createTestDb();
    await seedExpenseTransaction(db, { id: 'tx_1', baseAmount: 5000, date: JAN_MID });
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date)
       VALUES ('tx_income', 'acc_1', 'income', 10000, 'EUR', 10000, 'EUR', ?)`,
      [JAN_MID],
    );
    expect(await getGlobalBudgetSpend(db as any, JAN_START, FEB_START)).toBe(5000);
  });
});
