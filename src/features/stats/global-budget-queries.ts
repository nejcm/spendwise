import type { SQLiteDatabase } from 'expo-sqlite';

const GLOBAL_BUDGET_KEY = 'global_monthly_budget';

export async function getGlobalBudget(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM _meta WHERE key = ?`,
    [GLOBAL_BUDGET_KEY],
  );
  if (!row || row.value === null) return null;
  const parsed = Number.parseInt(row.value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setGlobalBudget(db: SQLiteDatabase, amountCents: number | null): Promise<void> {
  if (amountCents === null) {
    await db.runAsync(`DELETE FROM _meta WHERE key = ?`, [GLOBAL_BUDGET_KEY]);
  }
  else {
    await db.runAsync(
      `INSERT INTO _meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [GLOBAL_BUDGET_KEY, String(amountCents)],
    );
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
