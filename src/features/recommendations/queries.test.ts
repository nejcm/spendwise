import { createTestDb } from '@/test-utils/sqlite-db';
import { getRecommendations } from './queries';

describe('getRecommendations', () => {
  it('returns the main recommendation kinds from current data', async () => {
    const db = await createTestDb();

    await db.runAsync(
      `INSERT INTO accounts (id, name, type, currency, icon, color)
       VALUES
       ('acc_main', 'Main', 'checking', 'USD', '🏦', '#000000'),
       ('acc_sub', 'Subscriptions', 'checking', 'USD', '💳', '#111111')`,
    );

    await db.runAsync(
      `INSERT INTO categories (id, name, color, budget, sort_order)
       VALUES
       ('cat_groceries', 'Groceries', '#ff0000', 8000, 1),
       ('cat_coffee', 'Coffee', '#00ff00', NULL, 2),
       ('cat_apps', 'Apps', '#0000ff', NULL, 3)`,
    );

    const rows = [
      '(\'tx_hist_1\',\'acc_main\',\'cat_groceries\',\'expense\',2000,\'USD\',2000,\'USD\',1736899200,\'Groceries\')',
      '(\'tx_hist_2\',\'acc_main\',\'cat_groceries\',\'expense\',2200,\'USD\',2200,\'USD\',1738195200,\'Groceries\')',
      '(\'tx_hist_3\',\'acc_main\',\'cat_groceries\',\'expense\',2100,\'USD\',2100,\'USD\',1740787200,\'Groceries\')',
      '(\'tx_hist_4\',\'acc_main\',\'cat_coffee\',\'expense\',7000,\'USD\',7000,\'USD\',1737504000,\'Coffee shops\')',
      '(\'tx_hist_5\',\'acc_main\',\'cat_coffee\',\'expense\',7200,\'USD\',7200,\'USD\',1740182400,\'Coffee shops\')',
      '(\'tx_hist_6\',\'acc_main\',\'cat_coffee\',\'expense\',7600,\'USD\',7600,\'USD\',1741996800,\'Coffee shops\')',
      '(\'tx_curr_1\',\'acc_main\',\'cat_groceries\',\'expense\',14000,\'USD\',14000,\'USD\',1744416000,\'Groceries\')',
      '(\'tx_curr_2\',\'acc_main\',\'cat_coffee\',\'expense\',12000,\'USD\',12000,\'USD\',1744761600,\'Coffee shops\')',
    ];

    await db.runAsync(
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
       VALUES ${rows.join(',')}`,
    );

    await db.runAsync(
      `INSERT INTO recurring_rules (id, account_id, category_id, type, amount, currency, note, frequency, start_date, next_due_date, is_active)
       VALUES
       ('rule_1', 'acc_sub', 'cat_apps', 'expense', 4500, 'USD', 'Video Streaming', 'monthly', 1735689600, 1744848000, 1),
       ('rule_2', 'acc_sub', 'cat_apps', 'expense', 4000, 'USD', 'Cloud Storage', 'monthly', 1735689600, 1744934400, 1)`,
    );

    const recommendations = await getRecommendations(db as any, new Date('2025-04-15T00:00:00Z'));

    expect(recommendations.map((recommendation) => recommendation.kind)).toEqual(
      expect.arrayContaining([
        'upcoming_cashflow',
        'subscription_reminder',
        'category_anomaly',
        'unusual_spending',
        'budget_suggestion',
      ]),
    );
  });
});
