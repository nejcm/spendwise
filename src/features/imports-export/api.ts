import type { SQLiteDatabase } from 'expo-sqlite';

import type { ExportTransactionRow } from '@/features/imports-export/csv-export';
import { useMutation } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

export function useExportTransactions() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: () => getExportTransactions(db),
  });
}

async function getExportTransactions(db: SQLiteDatabase): Promise<ExportTransactionRow[]> {
  return db.getAllAsync<ExportTransactionRow>(
    `SELECT
        t.id,
        t.account_id,
        t.category_id,
        t.type,
        t.amount,
        t.currency,
        t.date,
        t.note,
        t.created_at,
        t.updated_at,
        a.name AS account_name,
        a.type AS account_type,
        a.currency AS account_currency,
        a.icon AS account_icon,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC`,
  );
}
