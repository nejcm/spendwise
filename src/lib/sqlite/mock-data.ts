// Mock data migration for the development environment
import type { SQLiteDatabase } from 'expo-sqlite';

export async function mockData(db: SQLiteDatabase): Promise<void> {
  // Clear existing mock data (safe order for foreign keys)
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM recurring_rule_runs;
    DELETE FROM recurring_rules;
    DELETE FROM accounts WHERE id = 'acc_cash_wallet' OR id = 'acc_savings'; 
  `);

  // Basic accounts
  await db.execAsync(`
    INSERT INTO accounts (id, name, type, icon, color, currency, budget)
    VALUES
      ('acc_cash_wallet', 'Cash Wallet', 'cash', '💵', '#66BB6A', 'EUR', NULL),
      ('acc_savings', 'Emergency Savings', 'savings', '💰', '#45B7D1', 'EUR', 100000);
  `);

  // Sample transactions (amounts are in cents)
  await db.execAsync(`
    INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
    VALUES
      -- Income
      ('tx_salary_001', 'acc_main_checking', 'cat_salary', 'income', 500000, 'EUR', 520000, 'USD', strftime('%s', date('now', '-15 days')), 'Monthly salary'),
      ('tx_freelance_001', 'acc_main_checking', 'cat_freelance', 'income', 120000, 'EUR', 128000, 'USD', strftime('%s', date('now', '-10 days')), 'Freelance project'),
      ('tx_salary_002', 'acc_main_checking', 'cat_salary', 'income', 520000, 'EUR', 545000, 'USD', strftime('%s', date('now', '-55 days')), 'Monthly salary'),
      ('tx_freelance_002', 'acc_main_checking', 'cat_freelance', 'income', 42000, 'EUR', 44200, 'USD', strftime('%s', date('now', '-33 days')), 'Freelance: website fixes'),
      ('tx_freelance_003', 'acc_main_checking', 'cat_freelance', 'income', 90000, 'EUR', 96000, 'USD', strftime('%s', date('now', '-21 days')), 'Freelance: mobile app feature'),

      -- Food & dining
      ('tx_food_001', 'acc_cash_wallet', 'cat_food', 'expense', 8500, 'EUR', 8900, 'USD', strftime('%s', date('now', '0 days')), 'Lunch with friends'),
      ('tx_food_002', 'acc_cash_wallet', 'cat_food', 'expense', 6000, 'EUR', 6400, 'USD', strftime('%s', date('now', '-9 days')), 'Lunch with friends'),
      ('tx_food_003', 'acc_cash_wallet', 'cat_food', 'expense', 23000, 'EUR', 25400, 'USD', strftime('%s', date('now', '-3 days')), 'Groceries'),
      ('tx_food_004', 'acc_cash_wallet', 'cat_food', 'expense', 12000, 'EUR', 12700, 'USD', strftime('%s', date('now', '0 days')), 'Groceries'),
      ('tx_food_005', 'acc_main_checking', 'cat_food', 'expense', 5690, 'EUR', 5990, 'USD', strftime('%s', date('now', '-2 days')), 'Supermarket'),
      ('tx_food_006', 'acc_main_checking', 'cat_food', 'expense', 1890, 'EUR', 1990, 'USD', strftime('%s', date('now', '-4 days')), 'Coffee & pastry'),
      ('tx_food_007', 'acc_cash_wallet', 'cat_food', 'expense', 950, 'EUR', 970, 'USD', strftime('%s', date('now', '-5 days')), 'Lunch'),
      ('tx_food_008', 'acc_main_checking', 'cat_food', 'expense', 7420, 'EUR', 7620, 'USD', strftime('%s', date('now', '-11 days')), 'Groceries'),
      ('tx_food_009', 'acc_cash_wallet', 'cat_food', 'expense', 430, 'EUR', 460, 'USD', strftime('%s', date('now', '-13 days')), 'Snack'),
      ('tx_food_010', 'acc_main_checking', 'cat_food', 'expense', 3250, 'EUR', 3350, 'USD', strftime('%s', date('now', '-18 days')), 'Dinner'),
      ('tx_food_011', 'acc_main_checking', 'cat_food', 'expense', 6120, 'EUR', 6320, 'USD', strftime('%s', date('now', '-24 days')), 'Groceries'),
      ('tx_food_012', 'acc_cash_wallet', 'cat_food', 'expense', 1290, 'EUR', 1490, 'USD', strftime('%s', date('now', '-28 days')), 'Lunch'),
      ('tx_food_013', 'acc_main_checking', 'cat_food', 'expense', 860, 'EUR', 880, 'USD', strftime('%s', date('now', '-36 days')), 'Coffee'),
      ('tx_food_014', 'acc_main_checking', 'cat_food', 'expense', 15450, 'EUR', 15950, 'USD', strftime('%s', date('now', '-41 days')), 'Big grocery run'),

      -- Transportation
      ('tx_transport_001', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2700, 'USD', strftime('%s', date('now', '-8 days')), 'Monthly bus pass'),
      ('tx_transport_002', 'acc_main_checking', 'cat_transport', 'expense', 189, 'EUR', 199, 'USD', strftime('%s', date('now', '-1 days')), 'Bus ticket'),
      ('tx_transport_003', 'acc_cash_wallet', 'cat_transport', 'expense', 650, 'EUR', 690, 'USD', strftime('%s', date('now', '-6 days')), 'Taxi share'),
      ('tx_transport_004', 'acc_main_checking', 'cat_transport', 'expense', 4800, 'EUR', 4900, 'USD', strftime('%s', date('now', '-20 days')), 'Train tickets'),
      ('tx_transport_005', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2700, 'USD', strftime('%s', date('now', '-38 days')), 'Monthly bus pass'),
      ('tx_transport_006', 'acc_main_checking', 'cat_transport', 'expense', 1200, 'EUR', 1350, 'USD', strftime('%s', date('now', '-26 days')), 'Fuel'),

      -- Housing & utilities
      ('tx_rent_001', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 810000, 'USD', strftime('%s', date('now', '-14 days')), 'Rent'),
      ('tx_utilities_001', 'acc_main_checking', 'cat_utilities', 'expense', 9500, 'EUR', 9700, 'USD', strftime('%s', date('now', '-12 days')), 'Electricity & water'),
      ('tx_rent_002', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 810000, 'USD', strftime('%s', date('now', '-44 days')), 'Rent'),
      ('tx_utilities_002', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 7950, 'USD', strftime('%s', date('now', '-40 days')), 'Internet'),
      ('tx_utilities_003', 'acc_main_checking', 'cat_utilities', 'expense', 11200, 'EUR', 12200, 'USD', strftime('%s', date('now', '-22 days')), 'Gas'),
      ('tx_utilities_004', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4750, 'USD', strftime('%s', date('now', '-16 days')), 'Phone plan'),

      -- Entertainment & subscriptions
      ('tx_entertainment_001', 'acc_main_checking', 'cat_entertainment', 'expense', 1299, 'EUR', 1399, 'USD', strftime('%s', date('now', '-6 days')), 'Streaming service'),
      ('tx_shopping_001', 'acc_main_checking', 'cat_shopping', 'expense', 3499, 'EUR', 3699, 'USD', strftime('%s', date('now', '-5 days')), 'Online shopping'),
      ('tx_entertainment_002', 'acc_main_checking', 'cat_entertainment', 'expense', 1899, 'EUR', 1999, 'USD', strftime('%s', date('now', '-9 days')), 'Cinema tickets'),
      ('tx_entertainment_003', 'acc_cash_wallet', 'cat_entertainment', 'expense', 750, 'EUR', 780, 'USD', strftime('%s', date('now', '-12 days')), 'Arcade'),
      ('tx_entertainment_004', 'acc_main_checking', 'cat_entertainment', 'expense', 999, 'EUR', 1190, 'USD', strftime('%s', date('now', '-30 days')), 'Streaming service'),
      ('tx_entertainment_005', 'acc_main_checking', 'cat_entertainment', 'expense', 2599, 'EUR', 2799, 'USD', strftime('%s', date('now', '-34 days')), 'Concert ticket'),
      ('tx_shopping_002', 'acc_main_checking', 'cat_shopping', 'expense', 1299, 'EUR', 1399, 'USD', strftime('%s', date('now', '-3 days')), 'Household items'),
      ('tx_shopping_003', 'acc_main_checking', 'cat_shopping', 'expense', 5999, 'EUR', 6151, 'USD', strftime('%s', date('now', '-17 days')), 'Shoes'),
      ('tx_shopping_004', 'acc_cash_wallet', 'cat_shopping', 'expense', 1190, 'EUR', 1322, 'USD', strftime('%s', date('now', '-19 days')), 'Accessories'),
      ('tx_shopping_005', 'acc_main_checking', 'cat_shopping', 'expense', 2499, 'EUR', 2632, 'USD', strftime('%s', date('now', '-27 days')), 'Books'),
      ('tx_shopping_006', 'acc_main_checking', 'cat_shopping', 'expense', 8999, 'EUR', 9144, 'USD', strftime('%s', date('now', '-47 days')), 'Jacket'),

      -- Health & personal care
      ('tx_health_001', 'acc_main_checking', 'cat_healthcare', 'expense', 2200, 'EUR', 2356, 'USD', strftime('%s', date('now', '-7 days')), 'Pharmacy'),
      ('tx_personal_001', 'acc_cash_wallet', 'cat_personal', 'expense', 1500, 'EUR', 1705, 'USD', strftime('%s', date('now', '-2 days')), 'Haircut'),
      ('tx_health_002', 'acc_main_checking', 'cat_healthcare', 'expense', 4500, 'EUR', 4690, 'USD', strftime('%s', date('now', '-14 days')), 'Doctor visit'),
      ('tx_health_003', 'acc_main_checking', 'cat_healthcare', 'expense', 1290, 'EUR', 1381, 'USD', strftime('%s', date('now', '-23 days')), 'Pharmacy'),
      ('tx_health_004', 'acc_main_checking', 'cat_healthcare', 'expense', 3990, 'EUR', 4167, 'USD', strftime('%s', date('now', '-37 days')), 'Dentist co-pay'),
      ('tx_personal_002', 'acc_cash_wallet', 'cat_personal', 'expense', 690, 'EUR', 745, 'USD', strftime('%s', date('now', '-8 days')), 'Toiletries'),
      ('tx_personal_003', 'acc_main_checking', 'cat_personal', 'expense', 2990, 'EUR', 3149, 'USD', strftime('%s', date('now', '-29 days')), 'Gym day pass'),
      ('tx_personal_004', 'acc_main_checking', 'cat_personal', 'expense', 1590, 'EUR', 1743, 'USD', strftime('%s', date('now', '-31 days')), 'Skincare'),

      -- Savings transfer (represented as two sides for now)
      ('tx_transfer_out_savings', 'acc_main_checking', NULL, 'transfer', 50000, 'EUR', 51200, 'USD', strftime('%s', date('now', '-4 days')), 'Transfer to savings'),
      ('tx_transfer_in_savings', 'acc_savings', NULL, 'transfer', 50000, 'EUR', 51300, 'USD', strftime('%s', date('now', '-4 days')), 'Transfer from checking');
  `);

  // Sample recurring rules
  await db.execAsync(`
    INSERT INTO recurring_rules (id, account_id, category_id, type, amount, currency, note, frequency, start_date, end_date, next_due_date, is_active)
    VALUES
      ('rule_salary', 'acc_main_checking', 'cat_salary', 'income', 920000, 'EUR', 'Monthly salary', 'monthly', strftime('%s', date('now', '-100 days')), NULL, strftime('%s', date('now', '-15 days')), 1);
  `);
}
