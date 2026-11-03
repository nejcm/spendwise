import type { WriteToolName } from './tools';
import type { CategorySpend } from '@/features/insights/types';
import type { TestDb } from '@/test-utils/sqlite-db';
import { getCategorySpendByRange, getSummaryByRange } from '@/features/insights/queries';

import { createTestDb } from '@/test-utils/sqlite-db';
import { executeToolCall, executeWriteToolCall, getToolStatusMessage, isWriteTool } from './tool-executor';

jest.mock('@/features/insights/queries', () => ({
  getCategorySpendByRange: jest.fn(),
  getSummaryByRange: jest.fn(),
  getTrendByRange: jest.fn(),
}));

jest.mock('@/features/transactions/queries', () => ({
  getTransactionsSample: jest.fn(),
  getTransactionById: jest.fn(),
  setTransactionsCategory: jest.fn(),
}));

const getCategorySpendByRangeMock = getCategorySpendByRange as jest.MockedFunction<typeof getCategorySpendByRange>;
const getSummaryByRangeMock = getSummaryByRange as jest.MockedFunction<typeof getSummaryByRange>;

describe('ai tool executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns translated tool status messages with date ranges', () => {
    expect(getToolStatusMessage('get_summary', {
      start_date: '2026-01-01',
      end_date: '2026-02-01',
    })).toBe('Looking up your financial summary (2026-01-01 to 2026-02-01)...');
  });

  it('wraps tool execution failures as JSON errors', async () => {
    getSummaryByRangeMock.mockRejectedValueOnce(new Error('Invalid date range'));

    await expect(executeToolCall({} as never, 'get_summary', {
      start_date: '2026-01-01',
      end_date: '2026-02-01',
    })).resolves.toBe(JSON.stringify({ error: 'Invalid date range' }));
  });

  it('reports category expense and income totals separately', async () => {
    const row = (category_name: string, expense_total: number, income_total: number): CategorySpend => ({
      category_id: category_name,
      category_name,
      category_color: '',
      category_icon: '',
      category_budget: null,
      category_type: 'expense',
      sort_order: 0,
      total: expense_total + income_total,
      income_total,
      expense_total,
      percentage: 0,
    });
    getCategorySpendByRangeMock.mockResolvedValueOnce([row('Food', 3000, 1000), row('Idle', 0, 0), row('Refunds', 0, 500)]);

    const result = JSON.parse(await executeToolCall({} as never, 'get_category_spending', {
      start_date: '2026-01-01',
      end_date: '2026-02-01',
    }));

    expect(result.categories).toEqual([
      { name: 'Food', kind: 'expense', expense_total: 30, income_total: 10, budget: null },
      { name: 'Refunds', kind: 'expense', expense_total: 0, income_total: 5, budget: null },
    ]);
  });

  it('passes the scoped account ids to the query', async () => {
    getSummaryByRangeMock.mockResolvedValueOnce({ income: 0, expense: 0, balance: 0 });
    const db = {} as never;

    await executeToolCall(db, 'get_summary', { start_date: '2026-01-01', end_date: '2026-02-01' }, ['acc_1']);

    expect(getSummaryByRangeMock).toHaveBeenCalledWith(db, expect.any(Number), expect.any(Number), ['acc_1']);
  });
});

jest.mock('@/features/accounts/queries', () => ({ getAccounts: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'rule-id' }));
jest.mock('@/features/categories/queries', () => ({ getCategories: jest.fn(), updateCategory: jest.fn() }));
jest.mock('@/features/scheduled-transactions/queries', () => ({ createScheduledTransaction: jest.fn() }));
jest.mock('@/features/scheduled-transactions/hooks', () => ({ syncDueScheduledTransactions: jest.fn() }));

describe('ai write tools', () => {
  const { getAccounts } = jest.requireMock<Record<string, jest.Mock>>('@/features/accounts/queries');
  const { getCategories, updateCategory } = jest.requireMock<Record<string, jest.Mock>>('@/features/categories/queries');
  const { getTransactionById, setTransactionsCategory } = jest.requireMock<Record<string, jest.Mock>>('@/features/transactions/queries');
  const { createScheduledTransaction } = jest.requireMock<Record<string, jest.Mock>>('@/features/scheduled-transactions/queries');
  const { syncDueScheduledTransactions } = jest.requireMock<Record<string, jest.Mock>>('@/features/scheduled-transactions/hooks');

  const db = { withTransactionAsync: (task: () => Promise<void>) => task() } as never;
  const queryClient = { invalidateQueries: jest.fn() };
  const food = { id: 'cat_food', name: 'Food', icon: null, color: '#fff', kind: 'expense', budget: 10000, sort_order: 0, created_at: 0 };
  const salary = { ...food, id: 'cat_salary', name: 'Salary', kind: 'income', budget: null };
  const tx = (id: string, extra: object = {}) => ({ id, account_id: 'acc_1', type: 'expense', transfer_id: null, ...extra });
  const rule = { account_id: 'acc_1', category_id: 'cat_food', type: 'expense', amount_cents: 1299, currency: 'EUR', frequency: 'monthly', start_date: '2026-12-01', note: 'Netflix' };

  const run = (tool: WriteToolName, args: Record<string, unknown>, confirmed = true) => {
    const confirm = jest.fn(async () => confirmed);
    const result = executeWriteToolCall({ db, queryClient: queryClient as never, accountIds: ['acc_1'], confirm }, tool, args).then((json) => JSON.parse(json));
    return { result, confirm };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getCategories.mockResolvedValue([food, salary]);
    getAccounts.mockResolvedValue([{ id: 'acc_1', name: 'Checking', currency: 'EUR' }, { id: 'acc_2', name: 'Savings', currency: 'EUR' }]);
    getTransactionById.mockImplementation(async (_: unknown, id: string) => ({
      t1: tx('t1'),
      t2: tx('t2'),
      income: tx('income', { type: 'income' }),
      transfer: tx('transfer', { type: 'transfer', transfer_id: 'x' }),
      other: tx('other', { account_id: 'acc_2' }),
    })[id] ?? null);
  });

  it('only treats the three write tools as writes', () => {
    expect(['set_category_budget', 'recategorize_transactions', 'create_recurring_rule'].every(isWriteTool)).toBe(true);
    expect(isWriteTool('get_summary')).toBe(false);
    expect(isWriteTool('toString')).toBe(false);
  });

  it.each([
    ['unknown category', 'set_category_budget', { category_id: 'nope', budget_cents: 100 }],
    ['negative budget', 'set_category_budget', { category_id: 'cat_food', budget_cents: -5 }],
    ['fractional budget', 'set_category_budget', { category_id: 'cat_food', budget_cents: 12.5 }],
    ['string budget', 'set_category_budget', { category_id: 'cat_food', budget_cents: '100' }],
    ['no transaction ids', 'recategorize_transactions', { transaction_ids: [], category_id: 'cat_food' }],
    ['unknown transaction', 'recategorize_transactions', { transaction_ids: ['t1', 'missing'], category_id: 'cat_food' }],
    ['transfer', 'recategorize_transactions', { transaction_ids: ['t1', 'transfer'], category_id: 'cat_food' }],
    ['kind mismatch', 'recategorize_transactions', { transaction_ids: ['income'], category_id: 'cat_food' }],
    ['account outside the chat scope', 'recategorize_transactions', { transaction_ids: ['other'], category_id: 'cat_food' }],
    ['rule account outside the chat scope', 'create_recurring_rule', { ...rule, account_id: 'acc_2' }],
    ['rule kind mismatch', 'create_recurring_rule', { ...rule, category_id: 'cat_salary' }],
    ['rule zero amount', 'create_recurring_rule', { ...rule, amount_cents: 0 }],
    ['rule currency', 'create_recurring_rule', { ...rule, currency: 'XXX' }],
    ['rule frequency', 'create_recurring_rule', { ...rule, frequency: 'hourly' }],
    ['rule date', 'create_recurring_rule', { ...rule, start_date: '2026-02-30' }],
  ])('rejects %s without asking or writing', async (_: string, tool: WriteToolName, args: Record<string, unknown>) => {
    const { result, confirm } = run(tool, args);

    expect(await result).toEqual({ error: expect.any(String) });
    expect(confirm).not.toHaveBeenCalled();
    expect(updateCategory).not.toHaveBeenCalled();
    expect(setTransactionsCategory).not.toHaveBeenCalled();
    expect(createScheduledTransaction).not.toHaveBeenCalled();
  });

  it('writes nothing when the user cancels', async () => {
    const { result, confirm } = run('recategorize_transactions', { transaction_ids: ['t1'], category_id: 'cat_food' }, false);

    expect(await result).toMatchObject({ status: 'cancelled' });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(setTransactionsCategory).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('sets a budget after confirmation and shows the change', async () => {
    const { result, confirm } = run('set_category_budget', { category_id: 'cat_food', budget_cents: 25050 });

    expect(await result).toEqual({ status: 'applied' });
    expect(confirm).toHaveBeenCalledWith({ tool: 'set_category_budget', categoryId: 'cat_food', categoryName: 'Food', budget: 25050, previousBudget: 10000 });
    expect(updateCategory).toHaveBeenCalledWith(db, 'cat_food', expect.objectContaining({ name: 'Food', kind: 'expense', budget: '250.5' }));
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('clears a budget with null', async () => {
    expect(await run('set_category_budget', { category_id: 'cat_food', budget_cents: null }).result).toEqual({ status: 'applied' });
    expect(updateCategory).toHaveBeenCalledWith(db, 'cat_food', expect.objectContaining({ budget: null }));
  });

  it('moves deduplicated transactions after confirmation', async () => {
    const { result } = run('recategorize_transactions', { transaction_ids: ['t1', 't2', 't1'], category_id: 'cat_food' });

    expect(await result).toEqual({ status: 'applied' });
    expect(setTransactionsCategory).toHaveBeenCalledWith(db, ['t1', 't2'], 'cat_food');
  });

  it('creates a recurring rule through the scheduled-transactions API', async () => {
    expect(await run('create_recurring_rule', rule).result).toEqual({ status: 'applied' });
    expect(createScheduledTransaction).toHaveBeenCalledWith(db, expect.objectContaining({
      account_id: 'acc_1',
      category_id: 'cat_food',
      type: 'expense',
      amount: 12.99,
      currency: 'EUR',
      frequency: 'monthly',
      note: 'Netflix',
      end_date: null,
      is_active: true,
    }));
    expect(syncDueScheduledTransactions).toHaveBeenCalledWith(db, queryClient);
  });

  it('returns the write error to the model', async () => {
    setTransactionsCategory.mockRejectedValueOnce(new Error('disk full'));

    expect(await run('recategorize_transactions', { transaction_ids: ['t1'], category_id: 'cat_food' }).result).toEqual({ error: 'disk full' });
  });
});

describe('ai write tools against a changing database', () => {
  const actual = {
    ...jest.requireActual<Record<string, jest.Mock>>('@/features/accounts/queries'),
    ...jest.requireActual<Record<string, jest.Mock>>('@/features/categories/queries'),
    ...jest.requireActual<Record<string, jest.Mock>>('@/features/transactions/queries'),
    ...jest.requireActual<Record<string, jest.Mock>>('@/features/scheduled-transactions/queries'),
  };
  const mocks = {
    ...jest.requireMock<Record<string, jest.Mock>>('@/features/accounts/queries'),
    ...jest.requireMock<Record<string, jest.Mock>>('@/features/categories/queries'),
    ...jest.requireMock<Record<string, jest.Mock>>('@/features/transactions/queries'),
    ...jest.requireMock<Record<string, jest.Mock>>('@/features/scheduled-transactions/queries'),
  };
  const queryClient = { invalidateQueries: jest.fn() } as never;
  let db: TestDb;

  beforeEach(async () => {
    for (const name of ['getAccounts', 'getCategories', 'updateCategory', 'getTransactionById', 'setTransactionsCategory', 'createScheduledTransaction']) {
      mocks[name].mockImplementation(actual[name]);
    }
    db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR'), ('acc_2', 'Savings', 'savings', 'EUR')`);
    await db.runAsync(`INSERT INTO categories (id, name, color, kind, budget) VALUES ('food', 'Food', '#fff', 'expense', 10000), ('fun', 'Fun', '#fff', 'expense', NULL)`);
    await db.runAsync(`INSERT INTO transactions (id, account_id, category_id, type, amount, baseAmount, date) VALUES
      ('t1', 'acc_1', 'food', 'expense', -1000, -1000, 0), ('t2', 'acc_1', 'food', 'expense', -2000, -2000, 0)`);
  });

  const write = (tool: WriteToolName, args: Record<string, unknown>, whilePending: () => Promise<unknown> = async () => {}) =>
    executeWriteToolCall({ db: db as never, queryClient, accountIds: ['acc_1'], confirm: async () => {
      await whilePending();
      return true;
    } }, tool, args).then((json) => JSON.parse(json));
  const categoryOf = async (id: string) => (await db.getFirstAsync<{ category_id: string }>('SELECT category_id FROM transactions WHERE id = ?', [id]))?.category_id;
  const moveToFun = { transaction_ids: ['t1', 't2'], category_id: 'fun' };

  it('moves the confirmed transactions', async () => {
    expect(await write('recategorize_transactions', moveToFun)).toEqual({ status: 'applied' });
    expect([await categoryOf('t1'), await categoryOf('t2')]).toEqual(['fun', 'fun']);
  });

  it.each([
    ['a transaction moves to an account outside the scope', `UPDATE transactions SET account_id = 'acc_2' WHERE id = 't2'`],
    ['the destination becomes an income category', `UPDATE categories SET kind = 'income' WHERE id = 'fun'`],
    ['a selected transaction is deleted', `DELETE FROM transactions WHERE id = 't2'`],
  ])('writes nothing when %s while pending', async (_: string, change: string) => {
    expect(await write('recategorize_transactions', moveToFun, () => db.runAsync(change))).toEqual({ error: expect.any(String) });
    expect(await categoryOf('t1')).toBe('food');
  });

  it('writes no budget when the category is deleted while pending', async () => {
    const result = await write('set_category_budget', { category_id: 'fun', budget_cents: 5000 }, () => db.runAsync(`DELETE FROM categories WHERE id = 'fun'`));
    expect(result).toEqual({ error: expect.any(String) });
  });

  it('creates no rule when the account is archived while pending', async () => {
    const rule = { account_id: 'acc_1', category_id: 'fun', type: 'expense', amount_cents: 999, currency: 'EUR', frequency: 'monthly', start_date: '2026-12-01' };
    const result = await write('create_recurring_rule', rule, () => db.runAsync(`UPDATE accounts SET is_archived = 1 WHERE id = 'acc_1'`));
    expect(result).toEqual({ error: expect.any(String) });
    expect(await db.getFirstAsync('SELECT id FROM recurring_rules')).toBeNull();
  });

  it('creates a confirmed rule', async () => {
    const rule = { account_id: 'acc_1', category_id: 'fun', type: 'expense', amount_cents: 999, currency: 'EUR', frequency: 'monthly', start_date: '2026-12-01' };

    expect(await write('create_recurring_rule', rule)).toEqual({ status: 'applied' });
    expect(await db.getFirstAsync('SELECT id, category_id FROM recurring_rules')).toEqual({ id: 'rule-id', category_id: 'fun' });
  });

  it('creates no rule when the category kind changes between the re-check and the insert', async () => {
    mocks.createScheduledTransaction.mockImplementationOnce(async (...args: unknown[]) => {
      await db.runAsync(`UPDATE categories SET kind = 'income' WHERE id = 'fun'`);
      return actual.createScheduledTransaction(...args);
    });
    const rule = { account_id: 'acc_1', category_id: 'fun', type: 'expense', amount_cents: 999, currency: 'EUR', frequency: 'monthly', start_date: '2026-12-01' };

    expect(await write('create_recurring_rule', rule)).toEqual({ error: expect.any(String) });
    expect(await db.getFirstAsync('SELECT id FROM recurring_rules')).toBeNull();
  });
});
