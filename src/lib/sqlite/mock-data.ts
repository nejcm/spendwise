// Mock data migration for the development environment
import type { SQLiteDatabase } from 'expo-sqlite';

export async function mockData(db: SQLiteDatabase): Promise<void> {
  // Basic accounts
  await db.execAsync(`
    INSERT INTO accounts (id, name, type, currency)
    VALUES
      ('acc_cash_wallet', 'Cash Wallet', 'cash', 'EUR'),
      ('acc_main_checking', 'Main Checking', 'checking', 'EUR'),
      ('acc_savings', 'Emergency Savings', 'savings', 'EUR');
  `);

  // Sample transactions (amounts are in cents)
  await db.execAsync(`
    INSERT INTO transactions (id, account_id, category_id, type, amount, currency, date, note)
    VALUES
      -- Income
      ('tx_salary_001', 'acc_main_checking', 'cat_salary', 'income', 320000, 'EUR', date('now', '-15 days'), 'Monthly salary'),
      ('tx_freelance_001', 'acc_main_checking', 'cat_freelance', 'income', 65000, 'EUR', date('now', '-10 days'), 'Freelance project'),

      -- Food & dining
      ('tx_food_001', 'acc_cash_wallet', 'cat_food', 'expense', 85, 'EUR', date('now', '-1 days'), 'Lunch with friends'),
      ('tx_food_002', 'acc_cash_wallet', 'cat_food', 'expense', 60, 'EUR', date('now', '-9 days'), 'Lunch with friends'),
      ('tx_food_003', 'acc_cash_wallet', 'cat_food', 'expense', 230, 'EUR', date('now', '-3 days'), 'Groceries'),
      ('tx_food_004', 'acc_cash_wallet', 'cat_food', 'expense', 120, 'EUR', date('now', '0 days'), 'Groceries'),

      -- Transportation
      ('tx_transport_001', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', date('now', '-8 days'), 'Monthly bus pass'),

      -- Housing & utilities
      ('tx_rent_001', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', date('now', '-14 days'), 'Rent'),
      ('tx_utilities_001', 'acc_main_checking', 'cat_utilities', 'expense', 9500, 'EUR', date('now', '-12 days'), 'Electricity & water'),

      -- Entertainment & subscriptions
      ('tx_entertainment_001', 'acc_main_checking', 'cat_entertainment', 'expense', 1299, 'EUR', date('now', '-6 days'), 'Streaming service'),
      ('tx_shopping_001', 'acc_main_checking', 'cat_shopping', 'expense', 3499, 'EUR', date('now', '-5 days'), 'Online shopping'),

      -- Health & personal care
      ('tx_health_001', 'acc_main_checking', 'cat_healthcare', 'expense', 2200, 'EUR', date('now', '-7 days'), 'Pharmacy'),
      ('tx_personal_001', 'acc_cash_wallet', 'cat_personal', 'expense', 1500, 'EUR', date('now', '-2 days'), 'Haircut'),

      -- Savings transfer (represented as two sides for now)
      ('tx_transfer_out_savings', 'acc_main_checking', NULL, 'transfer', 50000, 'EUR', date('now', '-4 days'), 'Transfer to savings'),
      ('tx_transfer_in_savings', 'acc_savings', NULL, 'transfer', 50000, 'EUR', date('now', '-4 days'), 'Transfer from checking');
  `);
}
