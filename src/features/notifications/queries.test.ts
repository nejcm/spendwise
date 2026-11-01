import { createTestDb } from '@/test-utils/sqlite-db';
import { getAccountBalances, getBudgetSpendForMonth } from './queries';

const DAY_START = new Date(2026, 2, 15).getTime() / 1000;
const NEXT_DAY_START = new Date(2026, 2, 16).getTime() / 1000;

async function seedBudgetFixture(db: Awaited<ReturnType<typeof createTestDb>>) {
  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, budget, sort_order)
     VALUES ('cat_food', 'Food', NULL, '#000000', 310000, 0)`,
    [],
  );
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency, is_archived, sort_order)
     VALUES ('acc_1', 'Checking', 'checking', 'EUR', 0, 0)`,
    [],
  );
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
     VALUES (?, 'acc_1', 'cat_food', 'expense', ?, 'EUR', ?, 'EUR', ?)`,
    ['tx_day', 5000, 5000, DAY_START + 60],
  );
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
     VALUES (?, 'acc_1', 'cat_food', 'expense', ?, 'EUR', ?, 'EUR', ?)`,
    ['tx_next_day', 7000, 7000, NEXT_DAY_START + 60],
  );
}

describe('getBudgetSpendForMonth', () => {
  it('sums category spending inside a one-day range', async () => {
    const db = await createTestDb();
    await seedBudgetFixture(db);

    expect(await getBudgetSpendForMonth(db as any, DAY_START, NEXT_DAY_START)).toEqual([
      {
        id: 'cat_food',
        name: 'Food',
        icon: null,
        color: '#000000',
        budget: 310000,
        spent: 5000,
      },
    ]);
  });
});

describe('getAccountBalances', () => {
  it('subtracts an out leg even when its baseAmount is negative', async () => {
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR')`, []);
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date)
       VALUES ('t_in', 'acc_1', 'income', 20000, 'EUR', 20000, 'EUR', ?), ('t_out', 'acc_1', 'transfer', -5000, 'EUR', -5000, 'EUR', ?)`,
      [DAY_START, DAY_START],
    );

    expect(await getAccountBalances(db as any)).toEqual([{ id: 'acc_1', name: 'Checking', baseBalance: 15000 }]);
  });
});
