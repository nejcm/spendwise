import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from './';

import { withWriteTransaction } from '@/lib/sqlite';
import { getAppState, setCurrency } from '@/lib/store/store';

import { computeBaseAmount } from './conversion';
import { getRatesForDates } from './queries';

type Row = { id: string; amount: number; currency: string; date: number; transfer_id: string | null };

/** Rewrites every transaction's baseAmount into `newCurrency` and sets Preferred Currency in the same write transaction. */
export async function changePreferredCurrency(db: SQLiteDatabase, newCurrency: CurrencyKey): Promise<void> {
  const dates = await db.getAllAsync<{ date: number }>(`SELECT DISTINCT date FROM transactions`);
  await getRatesForDates(db, dates.map((r) => r.date));

  const previousCurrency = getAppState().currency;
  // Re-read inside the write so rows inserted while rates were fetched are converted too.
  await withWriteTransaction(db, async () => {
    const transactions = await db.getAllAsync<Row>(
      `SELECT id, amount, currency, date, transfer_id FROM transactions`,
    );

    const byDate = new Map<number, Row[]>();
    for (const tx of transactions) {
      const bucket = byDate.get(tx.date) ?? [];
      bucket.push(tx);
      byDate.set(tx.date, bucket);
    }

    const ratesByDate = await getRatesForDates(db, [...byDate.keys()], { fetchIfMissing: false });

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

    for (const tx of computed) {
      await db.runAsync(
        `UPDATE transactions SET baseAmount = ?, baseCurrency = ? WHERE id = ?`,
        [outLegBase.get(tx.transfer_id) ?? tx.baseAmount, newCurrency, tx.id],
      );
    }
    // Before commit, so a queued scheduler write reads the new preference.
    setCurrency(newCurrency);
  }).catch((error: unknown) => {
    setCurrency(previousCurrency);
    throw error;
  });
}
