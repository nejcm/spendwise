import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from './';

import { computeBaseAmount } from './conversion';
import { getRatesForDate } from './queries';

/**
 * Recalculates baseAmount and baseCurrency for every transaction using the
 * historical rate closest to each transaction's date.
 *
 * Run this when the user changes their preferred display currency.
 * All updates are wrapped in a single SQLite transaction for atomicity.
 *
 * @returns The number of transactions updated.
 */
export async function recalculateAllBaseAmounts(
  db: SQLiteDatabase,
  newCurrency: CurrencyKey,
): Promise<number> {
  const transactions = await db.getAllAsync<{ id: string; amount: number; currency: string; date: number }>(
    `SELECT id, amount, currency, date FROM transactions`,
  );

  if (transactions.length === 0) return 0;

  // Group transactions by date to minimise DB round-trips for rate lookups
  const byDate = new Map<number, Array<{ id: string; amount: number; currency: string }>>();
  for (const tx of transactions) {
    const bucket = byDate.get(tx.date) ?? [];
    bucket.push({ id: tx.id, amount: tx.amount, currency: tx.currency });
    byDate.set(tx.date, bucket);
  }

  const updates: Array<{ id: string; baseAmount: number }> = [];

  for (const [date, txs] of byDate) {
    const rates = await getRatesForDate(db, date);
    for (const tx of txs) {
      const baseAmount = computeBaseAmount(tx.amount, tx.currency as CurrencyKey, newCurrency, rates);
      updates.push({ id: tx.id, baseAmount });
    }
  }

  await db.withTransactionAsync(async () => {
    for (const { id, baseAmount } of updates) {
      await db.runAsync(
        `UPDATE transactions SET baseAmount = ?, baseCurrency = ? WHERE id = ?`,
        [baseAmount, newCurrency, id],
      );
    }
  });

  return updates.length;
}
