import type { SQLiteDatabase } from 'expo-sqlite';

export type ClearSelectedDataOptions = {
  deleteAccounts: boolean;
  deleteCategories: boolean;
};

const deleteTransactionsSql = 'DELETE FROM transactions;';
const deleteRecurringRuleRunsSql = 'DELETE FROM recurring_rule_runs;';
const deleteRecurringRulesSql = 'DELETE FROM recurring_rules;';
const deleteAccountsSql = 'DELETE FROM accounts;';
const deleteCategoriesSql = 'DELETE FROM categories;';
const deleteCurrencyRatesSql = 'DELETE FROM currency_rates;';

/**
 * Clears all data from the database.
 */
export async function clearDbData(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    ${deleteRecurringRuleRunsSql}
    ${deleteRecurringRulesSql}
    ${deleteTransactionsSql}
    ${deleteAccountsSql}
    ${deleteCategoriesSql}
    ${deleteCurrencyRatesSql}
    PRAGMA foreign_keys = ON;
  `);
};

/**
 * Clears all transactions from the database.
 */
export async function clearTransactionsDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ${deleteTransactionsSql}
  `);
}

/**
 * Clears core transactional data and optionally accounts/categories.
 * Transactions and recurring rules are always removed.
 */
export async function clearSelectedDataDb(
  db: SQLiteDatabase,
  { deleteAccounts, deleteCategories }: ClearSelectedDataOptions,
): Promise<void> {
  const sql = `
    ${deleteRecurringRuleRunsSql}
    ${deleteRecurringRulesSql}
    ${deleteTransactionsSql}
    ${deleteAccounts ? deleteAccountsSql : ''}
    ${deleteCategories ? deleteCategoriesSql : ''}
  `;

  await db.execAsync('BEGIN TRANSACTION;');
  try {
    await db.execAsync(sql);
    await db.execAsync('COMMIT;');
  }
  catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

/**
 * Drops all tables and sets the user version to 0.
 */
export async function dropDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS _meta;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS recurring_rules;
    DROP TABLE IF EXISTS recurring_rule_runs;
    DROP TABLE IF EXISTS currency_rates;
  `);
  await db.execAsync(`PRAGMA user_version = 0`);
}
