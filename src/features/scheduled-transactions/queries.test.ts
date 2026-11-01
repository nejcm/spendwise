import { createTestDb } from '@/test-utils/sqlite-db';
import { createScheduledTransaction, deleteScheduledTransaction, getRuleForTransaction, getRulePayments, restoreScheduledTransaction, RuleAccountArchivedError, updateScheduledTransaction } from './queries';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

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

describe('deleteScheduledTransaction undo', () => {
  const seed = `
    INSERT INTO accounts (id, name, type, currency, icon, color) VALUES ('acc', 'Main', 'checking', 'EUR', '🏦', '#000000');
    INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date, created_at, updated_at)
      VALUES ('rule', 'acc', 'expense', 1000, 'EUR', 'monthly', 100, 300, 111, 222);
    INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date) VALUES
      ('t1', 'acc', 'expense', 1000, 'EUR', 1000, 'EUR', 100),
      ('t2', 'acc', 'expense', 1000, 'EUR', 1000, 'EUR', 200);
    INSERT INTO recurring_rule_runs (id, rule_id, scheduled_for_date, transaction_id, created_at) VALUES
      ('r1', 'rule', 100, 't1', 333), ('r2', 'rule', 200, 't2', 444);
  `;
  const snapshot = (db: Awaited<ReturnType<typeof createTestDb>>) => Promise.all([
    db.getAllAsync('SELECT * FROM recurring_rules'),
    db.getAllAsync('SELECT * FROM recurring_rule_runs ORDER BY id'),
    db.getAllAsync('SELECT id FROM transactions ORDER BY id'),
  ]);

  it('keeps generated transactions on delete and restores the rule with its runs', async () => {
    const db = await createTestDb();
    await db.execAsync(seed);
    const before = await snapshot(db);

    const deleted = await deleteScheduledTransaction(db as any, 'rule');
    expect(await snapshot(db)).toEqual([[], [], before[2]]);

    await restoreScheduledTransaction(db as any, deleted);
    expect(await snapshot(db)).toEqual(before);
  });

  it('writes nothing when a generated transaction is gone', async () => {
    const db = await createTestDb();
    await db.execAsync(seed);
    const deleted = await deleteScheduledTransaction(db as any, 'rule');
    await db.runAsync(`DELETE FROM transactions WHERE id = 't2'`);

    await expect(restoreScheduledTransaction(db as any, deleted)).rejects.toHaveProperty('code', 'SQLITE_CONSTRAINT_FOREIGNKEY');
    expect(await snapshot(db)).toEqual([[], [], [{ id: 't1' }]]);
  });
});

describe('updateScheduledTransaction on an archived account', () => {
  const data = (is_active: boolean) => ({
    account_id: 'acc',
    category_id: 'cat',
    type: 'expense' as const,
    currency: 'EUR' as const,
    note: null,
    frequency: 'monthly' as const,
    start_date: Math.floor(Date.now() / 1000),
    end_date: null,
    amount: 10,
    is_active,
  });

  it('blocks resuming but allows edits that keep the rule paused', async () => {
    const db = await createTestDb();
    await db.execAsync(`
      INSERT INTO accounts (id, name, type, currency, is_archived) VALUES ('acc', 'Main', 'checking', 'EUR', 1);
      INSERT INTO categories (id, name, color) VALUES ('cat', 'Bills', '#000');
      INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date, is_active)
        VALUES ('rule', 'acc', 'expense', 1000, 'EUR', 'monthly', 100, 200, 0);
    `);

    await expect(updateScheduledTransaction(db as any, 'rule', data(true))).rejects.toBeInstanceOf(RuleAccountArchivedError);
    await updateScheduledTransaction(db as any, 'rule', data(false));
    expect(await db.getFirstAsync('SELECT is_active, amount FROM recurring_rules')).toEqual({ is_active: 0, amount: 1000 });

    await db.runAsync('UPDATE accounts SET is_archived = 0');
    await updateScheduledTransaction(db as any, 'rule', data(true));
    expect(await db.getFirstAsync('SELECT is_active FROM recurring_rules')).toEqual({ is_active: 1 });
  });

  it('blocks creating an active rule but allows a paused one', async () => {
    const db = await createTestDb();
    await db.execAsync(`
      INSERT INTO accounts (id, name, type, currency, is_archived) VALUES ('acc', 'Main', 'checking', 'EUR', 1);
      INSERT INTO categories (id, name, color) VALUES ('cat', 'Bills', '#000');
    `);

    await expect(createScheduledTransaction(db as any, data(true))).rejects.toBeInstanceOf(RuleAccountArchivedError);
    await createScheduledTransaction(db as any, data(false));
    expect(await db.getAllAsync('SELECT is_active FROM recurring_rules')).toEqual([{ is_active: 0 }]);
  });
});
