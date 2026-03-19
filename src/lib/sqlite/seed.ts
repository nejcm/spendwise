import type { SQLiteDatabase } from 'expo-sqlite';
import BUNDLED_RATES from './bundled-rates.json';

export async function seedDefaults(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM categories;
    DELETE FROM accounts;
  `);
  await db.execAsync(`
    INSERT INTO categories (id, name, icon, color, sort_order) VALUES
      ('cat_food', 'Food & Dining', '🍽️', '#FF6B6B', 0),
      ('cat_transport', 'Transportation', '🚗', '#4ECDC4', 1),
      ('cat_housing', 'Housing', '🏠', '#45B7D1', 2),
      ('cat_utilities', 'Utilities', '💡', '#96CEB4', 3),
      ('cat_entertainment', 'Entertainment', '🎬', '#FFEAA7', 4),
      ('cat_shopping', 'Shopping', '🛒', '#DDA0DD', 5),
      ('cat_healthcare', 'Healthcare', '🩺', '#FF8A80', 6),
      ('cat_education', 'Education', '🎓', '#82B1FF', 7),
      ('cat_personal', 'Personal Care', '🧴', '#EA80FC', 8),
      ('cat_subscriptions', 'Subscriptions', '🔁', '#B388FF', 9),
      ('cat_other_expense', 'Other', '📦', '#90A4AE', 10), 
      ('_unknown', 'Unknown', '?', '#333333', 11),
      ('cat_salary', 'Salary', '💼', '#66BB6A', 12),
      ('cat_freelance', 'Freelance', '💻', '#26A69A', 13),
      ('cat_investment', 'Investment', '📈', '#42A5F5', 14),
      ('cat_other_income', 'Other Income', '💰', '#78909C', 15);

    INSERT INTO accounts (id, name, type, icon, color, currency)
    VALUES
      ('acc_main_checking', 'Main Checking', 'checking', '💳', '#4ECDC4', 'EUR');
  `);
}

export async function seedBundledRates(db: SQLiteDatabase): Promise<void> {
  if (BUNDLED_RATES.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (const { quote, rate, date } of BUNDLED_RATES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO currency_rates (base, quote, rate, date) VALUES ('EUR', ?, ?, ?)`,
        [quote, rate, date],
      );
    }
  });
}
