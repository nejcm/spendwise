import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from './';

import { computeBaseAmount } from './conversion';
import { getRatesForDates } from './queries';

/**
 * Recalculates baseAmount and baseCurrency for every transaction using the
 * historical rate closest to each transaction's date.
 *
 * Run this when the user changes their preferred display currency.
 * All updates are wrapped in a single SQLite transaction for atomicity.
 *
 * @returns The number of transactions updated.
 */
type Row = { id: string; amount: number; currency: string; date: number; transfer_id: string | null };

export async function recalculateAllBaseAmounts(
  db: SQLiteDatabase,
  newCurrency: CurrencyKey,
): Promise<number> {
  const transactions = await db.getAllAsync<Row>(
    `SELECT id, amount, currency, date, transfer_id FROM transactions`,
  );

  if (transactions.length === 0) return 0;

  // Group transactions by date to minimise DB round-trips for rate lookups
  const byDate = new Map<number, Row[]>();
  for (const tx of transactions) {
    const bucket = byDate.get(tx.date) ?? [];
    bucket.push(tx);
    byDate.set(tx.date, bucket);
  }

  const ratesByDate = await getRatesForDates(db, [...byDate.keys()]);

  const computed: Array<Row & { baseAmount: number }> = [];
  for (const [date, txs] of byDate) {
    const rates = ratesByDate.get(date) ?? { EUR: 1 };
    for (const tx of txs) {
      computed.push({ ...tx, baseAmount: computeBaseAmount(Math.abs(tx.amount), tx.currency as CurrencyKey, newCurrency, rates) });
    }
  }

  // One baseAmount per transfer: rounding each leg in its own currency can drift a cent.
  const outLegBase = new Map<string | null, number>();
  for (const tx of computed) {
    if (tx.transfer_id && tx.amount < 0) outLegBase.set(tx.transfer_id, tx.baseAmount);
  }
  const updates = computed.map((tx) => ({ id: tx.id, baseAmount: outLegBase.get(tx.transfer_id) ?? tx.baseAmount }));

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
