import { createTestDb } from '@/test-utils/sqlite-db';
import { getRecommendations } from './queries';

jest.mock('@/features/currencies/service', () => ({
  fetchRates: jest.fn(),
  fetchRatesForDate: jest.fn().mockRejectedValue(new Error('offline')),
  fetchRatesForDateRange: jest.fn(),
}));

const { fetchRatesForDate } = jest.requireMock('@/features/currencies/service') as {
  fetchRatesForDate: jest.Mock;
};

describe('getRecommendations', () => {
  beforeEach(() => {
    fetchRatesForDate.mockClear();
  });

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

  it('uses baseBalance for upcoming cashflow when account has foreign-currency transactions', async () => {
    const db = await createTestDb();
    const today = new Date('2025-04-15T00:00:00Z');

    await db.runAsync(
      `INSERT INTO accounts (id, name, type, currency, icon, color)
       VALUES ('acc_main', 'Main', 'checking', 'EUR', '🏦', '#000000')`,
    );

    await db.runAsync(
      `INSERT INTO categories (id, name, color, sort_order)
       VALUES ('cat_bills', 'Bills', '#ff0000', 1)`,
    );

    await db.runAsync(
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
       VALUES
       ('tx_income', 'acc_main', 'cat_bills', 'income', 100000, 'EUR', 100000, 'EUR', 1744416000, 'Paycheck'),
       ('tx_usd', 'acc_main', 'cat_bills', 'expense', 100000000, 'USD', 920000, 'EUR', 1744502400, 'USD purchase')`,
    );

    await db.runAsync(
      `INSERT INTO recurring_rules (id, account_id, category_id, type, amount, currency, note, frequency, start_date, next_due_date, is_active)
       VALUES ('rule_rent', 'acc_main', 'cat_bills', 'expense', 85000, 'EUR', 'Rent', 'monthly', 1735689600, 1744848000, 1)`,
    );

    const recommendations = await getRecommendations(db as any, today);
    const cashflow = recommendations.find((recommendation) => recommendation.kind === 'upcoming_cashflow');

    expect(fetchRatesForDate).not.toHaveBeenCalled();
    expect(cashflow).toMatchObject({
      accountName: 'Main',
      amountCents: 85000,
      comparisonAmountCents: -820000,
      currency: 'EUR',
      severity: 'high',
    });
  });
});
