import { createTestDb } from '@/test-utils/sqlite-db';
import { getRuleForTransaction } from './queries';

describe('getRuleForTransaction', () => {
  it('finds the rule that generated a transaction, and nothing for manual rows', async () => {
    const db = await createTestDb();
    await db.execAsync(`
      INSERT INTO accounts (id, name, type, currency, icon, color) VALUES ('acc', 'Main', 'checking', 'EUR', '🏦', '#000000');
      INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date)
        VALUES ('rule', 'acc', 'expense', 1000, 'EUR', 'monthly', 100, 200);
      INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date) VALUES
        ('generated', 'acc', 'expense', -1000, 'EUR', 1000, 'EUR', 100),
        ('manual', 'acc', 'expense', -500, 'EUR', 500, 'EUR', 100);
      INSERT INTO recurring_rule_runs (id, rule_id, scheduled_for_date, transaction_id) VALUES ('run', 'rule', 100, 'generated');
    `);

    expect(await getRuleForTransaction(db as any, 'generated')).toEqual({ id: 'rule', frequency: 'monthly', next_due_date: 200, is_active: 1 });
    expect(await getRuleForTransaction(db as any, 'manual')).toBeNull();
  });
});
