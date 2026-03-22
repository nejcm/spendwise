import { createTestDb } from '@/test-utils/sqlite-db';

import { analyzeQuestionIntent, buildAiPromptContext, resolveQuestionRange } from './context';

const NOW = new Date('2026-03-20T12:00:00.000Z');
const FEB_10 = Math.floor(Date.UTC(2026, 1, 10) / 1000);
const MAR_05 = Math.floor(Date.UTC(2026, 2, 5) / 1000);
const MAR_12 = Math.floor(Date.UTC(2026, 2, 12) / 1000);

async function seedBase(db: Awaited<ReturnType<typeof createTestDb>>) {
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency) VALUES (?, ?, ?, ?)`,
    ['acc_1', 'Checking', 'checking', 'EUR'],
  );
  await db.runAsync(
    `INSERT INTO categories (id, name, color, sort_order) VALUES (?, ?, ?, ?)`,
    ['cat_food', 'Food', '#FF0000', 0],
  );
  await db.runAsync(
    `INSERT INTO categories (id, name, color, sort_order) VALUES (?, ?, ?, ?)`,
    ['cat_salary', 'Salary', '#00FF00', 1],
  );
}

async function seedTransaction(
  db: Awaited<ReturnType<typeof createTestDb>>,
  overrides: Record<string, unknown>,
) {
  const row = {
    id: 'txn_1',
    account_id: 'acc_1',
    category_id: 'cat_food',
    type: 'expense',
    amount: 12_345,
    currency: 'EUR',
    baseAmount: 12_345,
    baseCurrency: 'EUR',
    date: MAR_05,
    note: 'private note should not be shared',
    ...overrides,
  };

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.account_id, row.category_id, row.type, row.amount, row.currency, row.baseAmount, row.baseCurrency, row.date, row.note],
  );
}

describe('analyzeQuestionIntent', () => {
  it('keeps overview questions summary-first', () => {
    expect(analyzeQuestionIntent('Give me an overview of my spending this month.')).toEqual({
      includeTransactions: false,
      includeTrend: true,
    });
  });

  it('treats explicit transaction questions as detail requests', () => {
    expect(analyzeQuestionIntent('Show my recent transactions from last month.')).toEqual({
      includeTransactions: true,
      includeTrend: false,
    });
  });
});

describe('resolveQuestionRange', () => {
  it('recognizes month-specific prompts', () => {
    expect(resolveQuestionRange('How much did I spend last month?', NOW)).toMatchObject({
      preset: 'last-month',
      label: 'last month',
    });
  });
});

describe('buildAiPromptContext', () => {
  it('builds summary-first context for overview questions', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_1', date: MAR_05, baseAmount: 12_345, amount: 12_345 });
    await seedTransaction(db, { id: 'txn_2', category_id: 'cat_salary', type: 'income', date: MAR_12, baseAmount: 300_000, amount: 300_000 });

    const context = await buildAiPromptContext(
      db as any,
      'Give me an overview of my spending this month.',
      NOW,
    );

    expect(context.range).toMatchObject({
      preset: 'this-month',
      label: 'this month',
      startDateISO: '2026-03-01',
      endDateExclusiveISO: '2026-04-01',
    });
    expect(context.summary).toEqual({
      income: 3000,
      expense: 123.45,
      balance: 2876.55,
    });
    expect(context.topCategories).toEqual([
      expect.objectContaining({ name: 'Salary', total: 3000 }),
      expect.objectContaining({ name: 'Food', total: 123.45 }),
    ]);
    expect(context.transactionSample).toBeUndefined();
    expect(context.trend).toEqual([
      { date: '2026-03-05', income: 0, expense: 123.45 },
      { date: '2026-03-12', income: 3000, expense: 0 },
    ]);
  });

  it('includes a bounded transaction sample for detail questions and strips notes', async () => {
    const db = await createTestDb();
    await seedBase(db);
    await seedTransaction(db, { id: 'txn_feb', date: FEB_10, baseAmount: 5_000, amount: 5_000 });
    await seedTransaction(db, { id: 'txn_mar', date: MAR_05, baseAmount: 9_999, amount: 9_999 });

    const context = await buildAiPromptContext(
      db as any,
      'Show my recent transactions from last month.',
      NOW,
    );

    expect(context.range).toMatchObject({
      preset: 'last-month',
      startDateISO: '2026-02-01',
      endDateExclusiveISO: '2026-03-01',
    });
    expect(context.transactionSample).toEqual({
      partial: true,
      notesIncluded: false,
      limit: 12,
      count: 1,
      rows: [
        {
          date: '2026-02-10',
          type: 'expense',
          category: 'Food',
          amount: 50,
          currency: 'EUR',
          baseAmount: 50,
          baseCurrency: 'EUR',
        },
      ],
    });
    expect(context.transactionSample?.rows[0]).not.toHaveProperty('note');
    expect(context.trend).toBeUndefined();
  });
});
