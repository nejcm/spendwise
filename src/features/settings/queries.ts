import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORY_ID } from '@/config';
import { clearSelectedDataDb } from '@/lib/sqlite/db';

export type DataCounts = {
  /** A linked transfer pair counts once. */
  transactions: number;
  rules: number;
  activeRules: number;
  categories: number;
  accounts: number;
  openAccounts: number;
};

export async function getDataCounts(db: SQLiteDatabase): Promise<DataCounts> {
  const row = await db.getFirstAsync<DataCounts>(
    `SELECT
       (SELECT COUNT(DISTINCT COALESCE(transfer_id, id)) FROM transactions) AS transactions,
       (SELECT COUNT(*) FROM recurring_rules) AS rules,
       (SELECT COUNT(*) FROM recurring_rules WHERE is_active = 1) AS activeRules,
       (SELECT COUNT(*) FROM categories WHERE id <> ?) AS categories,
       (SELECT COUNT(*) FROM accounts) AS accounts,
       (SELECT COUNT(*) FROM accounts WHERE is_archived = 0) AS openAccounts`,
    [DEFAULT_CATEGORY_ID],
  );
  return row ?? { transactions: 0, rules: 0, activeRules: 0, categories: 0, accounts: 0, openAccounts: 0 };
}

/** Transactions and recurring rules are always deleted; categories and accounts only when picked. */
export type DeleteDataSelection = { categories: boolean; accounts: boolean };

export function deleteData(db: SQLiteDatabase, selection: DeleteDataSelection) {
  return clearSelectedDataDb(db, { deleteCategories: selection.categories, deleteAccounts: selection.accounts });
}
