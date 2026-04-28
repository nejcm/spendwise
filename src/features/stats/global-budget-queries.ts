import type { SQLiteDatabase } from 'expo-sqlite';

export type GlobalBudgetType = 'monthly' | 'yearly';
export type GlobalBudget = { amountCents?: number | null; type: GlobalBudgetType };

const GLOBAL_BUDGET_KEY = 'global_budget';
const GLOBAL_BUDGET_LEGACY_KEY = 'global_monthly_budget';

export async function getGlobalBudget(db: SQLiteDatabase): Promise<GlobalBudget | null> {
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM _meta WHERE key = ?`,
    [GLOBAL_BUDGET_KEY],
  );
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value) as { amount: number; type: GlobalBudgetType };
      if (Number.isFinite(parsed.amount) && parsed.amount > 0) {
        return { amountCents: parsed.amount, type: parsed.type ?? 'monthly' };
      }
    }
    catch {}
  }
  // Backward compat: read old key and treat as monthly
  const legacyRow = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM _meta WHERE key = ?`,
    [GLOBAL_BUDGET_LEGACY_KEY],
  );
  if (legacyRow?.value) {
    const amount = Number.parseInt(legacyRow.value, 10);
    if (Number.isFinite(amount) && amount > 0) {
      return { amountCents: amount, type: 'monthly' };
    }
  }
  return null;
}

export async function setGlobalBudget(db: SQLiteDatabase, budget: GlobalBudget | null): Promise<void> {
  if (budget === null) {
    await db.runAsync(`DELETE FROM _meta WHERE key IN (?, ?)`, [GLOBAL_BUDGET_KEY, GLOBAL_BUDGET_LEGACY_KEY]);
  }
  else {
    await db.runAsync(
      `INSERT INTO _meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [GLOBAL_BUDGET_KEY, JSON.stringify({ amount: budget.amountCents, type: budget.type })],
    );
    await db.runAsync(`DELETE FROM _meta WHERE key = ?`, [GLOBAL_BUDGET_LEGACY_KEY]);
  }
}

export async function getGlobalBudgetSpend(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(baseAmount), 0) AS total
     FROM transactions
     WHERE type = 'expense'
       AND date >= ?
       AND date < ?`,
    [startDate, endDate],
  );
  return row?.total ?? 0;
}
