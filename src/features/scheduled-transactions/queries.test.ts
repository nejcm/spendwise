import { createTestDb } from '@/test-utils/sqlite-db';
import { getRuleForTransaction, getRulePayments } from './queries';

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

describe('getRulePayments', () => {
  it('returns the latest transactions posted by the rule, newest first', async () => {
    const db = await createTestDb();
    await db.execAsync(`
      INSERT INTO accounts (id, name, type, currency, icon, color) VALUES ('acc', 'Main', 'checking', 'EUR', '🏦', '#000000');
      INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date)
        VALUES ('rule', 'acc', 'expense', 1000, 'EUR', 'monthly', 100, 400);
      INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date) VALUES
        ('t1', 'acc', 'expense', 1000, 'EUR', 1000, 'EUR', 100),
        ('t2', 'acc', 'expense', 1000, 'EUR', 1000, 'EUR', 200),
        ('t3', 'acc', 'expense', 1000, 'EUR', 1000, 'EUR', 300),
        ('manual', 'acc', 'expense', 500, 'EUR', 500, 'EUR', 350);
      INSERT INTO recurring_rule_runs (id, rule_id, scheduled_for_date, transaction_id) VALUES
        ('r1', 'rule', 100, 't1'), ('r2', 'rule', 200, 't2'), ('r3', 'rule', 300, 't3');
    `);

    const payments = await getRulePayments(db as any, 'rule', 2);
    expect(payments.map((p) => p.id)).toEqual(['t3', 't2']);
  });
});
