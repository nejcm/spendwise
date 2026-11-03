import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { ToolName, WriteToolName } from './tools';
import type { WriteAction } from '@/features/ai/types';

import { getAccounts } from '@/features/accounts/queries';
import { fitsTransactionType } from '@/features/categories/helpers';
import { getCategories, updateCategory } from '@/features/categories/queries';
import { CURRENCY_VALUES } from '@/features/currencies';
import { centsToAmount } from '@/features/formatting/helpers';
import { getCategorySpendByRange, getSummaryByRange, getTrendByRange } from '@/features/insights/queries';
import { syncDueScheduledTransactions } from '@/features/scheduled-transactions/hooks';
import { createScheduledTransaction } from '@/features/scheduled-transactions/queries';
import { getTransactionById, getTransactionsSample, setTransactionsCategory } from '@/features/transactions/queries';
import { invalidateFor } from '@/lib/data/invalidation';
import { dateToUnix, isValidISODate, unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { withWriteTransaction } from '@/lib/sqlite';
import { useAppStore } from '@/lib/store/store';

const MAX_TRANSACTION_LIMIT = 20;
const DEFAULT_TRANSACTION_LIMIT = 12;
const MAX_NOTE_LENGTH = 200;

type ToolArgs = Record<string, unknown>;

function parseDateRange(args: ToolArgs): { startDate: number; endDate: number } {
  const startDate = dateToUnix(String(args.start_date));
  const endDate = dateToUnix(String(args.end_date));
  return { startDate, endDate };
}

async function executeSummary(db: SQLiteDatabase, args: ToolArgs, accountIds?: readonly string[]) {
  const { startDate, endDate } = parseDateRange(args);
  const summary = await getSummaryByRange(db, startDate, endDate, accountIds);
  const displayCurrency = useAppStore.getState().currency;

  return {
    currency: displayCurrency,
    income: centsToAmount(summary.income),
    expense: centsToAmount(summary.expense),
    balance: centsToAmount(summary.balance),
  };
}

async function executeCategorySpending(db: SQLiteDatabase, args: ToolArgs, accountIds?: readonly string[]) {
  const { startDate, endDate } = parseDateRange(args);
  const rows = await getCategorySpendByRange(db, startDate, endDate, accountIds);
  const displayCurrency = useAppStore.getState().currency;

  return {
    currency: displayCurrency,
    categories: rows
      .filter((r) => r.expense_total > 0 || r.income_total > 0)
      .sort((a, b) => b.expense_total - a.expense_total || b.income_total - a.income_total)
      .map((r) => ({
        name: r.category_name,
        kind: r.category_type,
        expense_total: centsToAmount(r.expense_total),
        income_total: centsToAmount(r.income_total),
        budget: r.category_budget === null ? null : centsToAmount(r.category_budget),
      })),
  };
}

async function executeTransactions(db: SQLiteDatabase, args: ToolArgs, accountIds?: readonly string[]) {
  const { startDate, endDate } = parseDateRange(args);
  const rawLimit = typeof args.limit === 'number' ? args.limit : DEFAULT_TRANSACTION_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_TRANSACTION_LIMIT);
  const rows = await getTransactionsSample(db, startDate, endDate, { limit, accountIds });
  const displayCurrency = useAppStore.getState().currency;

  return {
    currency: displayCurrency,
    count: rows.length,
    limit,
    transactions: rows.map((t) => ({
      id: t.id,
      date: unixToISODate(t.date),
      type: t.type,
      category: t.category_name ?? null,
      amount: centsToAmount(t.amount),
      currency: t.currency,
      baseAmount: centsToAmount(t.baseAmount),
      baseCurrency: t.baseCurrency,
    })),
  };
}

async function executeTrends(db: SQLiteDatabase, args: ToolArgs, accountIds?: readonly string[]) {
  const { startDate, endDate } = parseDateRange(args);
  const rows = await getTrendByRange(db, startDate, endDate, accountIds);
  const displayCurrency = useAppStore.getState().currency;

  return {
    currency: displayCurrency,
    points: rows.map((p) => ({
      date: unixToISODate(p.date),
      income: centsToAmount(p.income),
      expense: centsToAmount(p.expense),
    })),
  };
}

async function executeAccountsAndCategories(db: SQLiteDatabase, _args: ToolArgs, accountIds?: readonly string[]) {
  const [accounts, categories] = await Promise.all([getAccounts(db), getCategories(db)]);
  return {
    accounts: accounts
      .filter((a) => !accountIds || accountIds.includes(a.id))
      .map((a) => ({ id: a.id, name: a.name, currency: a.currency })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      budget: c.budget === null ? null : centsToAmount(c.budget),
    })),
  };
}

const EXECUTORS: Record<ToolName, (db: SQLiteDatabase, args: ToolArgs, accountIds?: readonly string[]) => Promise<unknown>> = {
  get_summary: executeSummary,
  get_category_spending: executeCategorySpending,
  get_transactions: executeTransactions,
  get_trends: executeTrends,
  get_accounts_and_categories: executeAccountsAndCategories,
};

function requireId(args: ToolArgs, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || !value) throw new Error(`${key} must be a non-empty string`);
  return value;
}

function requireCents(args: ToolArgs, key: string): number {
  const value = args[key];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw new Error(`${key} must be a positive integer of cents`);
  return value;
}

function requireEnum<T extends string>(args: ToolArgs, key: string, values: readonly T[]): T {
  const value = args[key];
  if (!values.includes(value as T)) throw new Error(`${key} must be one of ${values.join(', ')}`);
  return value as T;
}

async function requireCategory(db: SQLiteDatabase, id: string) {
  const category = (await getCategories(db)).find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category_id: ${id}`);
  return category;
}

async function validateCategoryBudget(db: SQLiteDatabase, args: ToolArgs): Promise<WriteAction> {
  const category = await requireCategory(db, requireId(args, 'category_id'));
  const budget = args.budget_cents === null ? null : requireCents(args, 'budget_cents');
  return { tool: 'set_category_budget', categoryId: category.id, categoryName: category.name, budget, previousBudget: category.budget };
}

async function validateRecategorize(db: SQLiteDatabase, args: ToolArgs, accountIds?: readonly string[]): Promise<WriteAction> {
  const ids = args.transaction_ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_TRANSACTION_LIMIT || !ids.every((id) => typeof id === 'string' && id)) {
    throw new Error(`transaction_ids must be 1 to ${MAX_TRANSACTION_LIMIT} transaction ids`);
  }
  const category = await requireCategory(db, requireId(args, 'category_id'));
  const transactionIds = [...new Set(ids as string[])];
  const rows = await Promise.all(transactionIds.map((id) => getTransactionById(db, id)));
  const transactions = rows.map((t, i) => {
    if (!t || (accountIds && !accountIds.includes(t.account_id))) throw new Error(`Unknown transaction id: ${transactionIds[i]}`);
    if (t.type === 'transfer' || t.transfer_id) throw new Error(`Transaction ${t.id} is a transfer and has no category`);
    if (!fitsTransactionType(category, t.type)) throw new Error(`Category kind ${category.kind} does not match ${t.type} transaction ${t.id}`);
    return { id: t.id, date: t.date, amount: t.amount, currency: t.currency, account_name: t.account_name, category_name: t.category_name };
  });
  return { tool: 'recategorize_transactions', transactions, categoryId: category.id, categoryName: category.name };
}

async function validateRecurringRule(db: SQLiteDatabase, args: ToolArgs, accountIds?: readonly string[]): Promise<WriteAction> {
  const accountId = requireId(args, 'account_id');
  const account = (await getAccounts(db)).find((a) => a.id === accountId && (!accountIds || accountIds.includes(a.id)));
  if (!account) throw new Error(`Unknown account_id: ${accountId}`);
  const category = await requireCategory(db, requireId(args, 'category_id'));
  const type = requireEnum(args, 'type', ['income', 'expense'] as const);
  if (!fitsTransactionType(category, type)) throw new Error(`Category kind ${category.kind} does not match type ${type}`);
  const amount = requireCents(args, 'amount_cents');
  const currency = requireEnum(args, 'currency', CURRENCY_VALUES);
  const frequency = requireEnum(args, 'frequency', ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'] as const);
  const startDate = String(args.start_date ?? '');
  if (!isValidISODate(startDate)) throw new Error('start_date must be a YYYY-MM-DD date');
  if (args.note != null && (typeof args.note !== 'string' || args.note.length > MAX_NOTE_LENGTH)) throw new Error(`note must be text up to ${MAX_NOTE_LENGTH} characters`);
  return {
    tool: 'create_recurring_rule',
    amount,
    accountName: account.name,
    categoryName: category.name,
    rule: {
      account_id: account.id,
      category_id: category.id,
      type,
      amount: centsToAmount(amount),
      currency,
      note: typeof args.note === 'string' ? args.note : null,
      frequency,
      start_date: dateToUnix(startDate),
      end_date: null,
      is_active: true,
    },
  };
}

const WRITE_VALIDATORS: Record<WriteToolName, (db: SQLiteDatabase, args: ToolArgs, accountIds?: readonly string[]) => Promise<WriteAction>> = {
  set_category_budget: validateCategoryBudget,
  recategorize_transactions: validateRecategorize,
  create_recurring_rule: validateRecurringRule,
};

export function isWriteTool(toolName: string): toolName is WriteToolName {
  return Object.keys(WRITE_VALIDATORS).includes(toolName);
}

async function applyWriteAction(db: SQLiteDatabase, queryClient: QueryClient, action: WriteAction, revalidate: () => Promise<WriteAction>) {
  const assertUnchanged = async () => {
    if (JSON.stringify(await revalidate()) !== JSON.stringify(action)) throw new Error('The data changed while waiting for confirmation. Nothing was changed.');
  };
  switch (action.tool) {
    case 'set_category_budget':
      await withWriteTransaction(db, async () => {
        await assertUnchanged();
        const category = await requireCategory(db, action.categoryId);
        const budget = action.budget === null ? null : String(centsToAmount(action.budget));
        await updateCategory(db, category.id, { ...category, budget });
      });
      invalidateFor(queryClient, 'category');
      return;
    case 'recategorize_transactions':
      await withWriteTransaction(db, async () => {
        await assertUnchanged();
        await setTransactionsCategory(db, action.transactions.map((t) => t.id), action.categoryId);
      });
      invalidateFor(queryClient, 'transaction');
      return;
    case 'create_recurring_rule':
      // createScheduledTransaction opens its own write transaction (can't nest) and re-checks archive state and category kind inside it.
      await assertUnchanged();
      await createScheduledTransaction(db, action.rule);
      invalidateFor(queryClient, 'scheduledTransaction');
      await syncDueScheduledTransactions(db, queryClient);
  }
}

export type WriteToolContext = {
  readonly db: SQLiteDatabase;
  readonly queryClient: QueryClient;
  readonly accountIds?: readonly string[];
  readonly confirm: (action: WriteAction) => Promise<boolean>;
};

/** Validates the proposed change, waits for the user's decision, and writes only on confirm. */
export async function executeWriteToolCall(
  { db, queryClient, accountIds, confirm }: WriteToolContext,
  toolName: WriteToolName,
  args: ToolArgs,
): Promise<string> {
  try {
    const validate = () => WRITE_VALIDATORS[toolName](db, args, accountIds);
    const action = await validate();
    if (!await confirm(action)) return JSON.stringify({ status: 'cancelled', message: 'The user declined. Nothing was changed.' });
    await applyWriteAction(db, queryClient, action, validate);
    return JSON.stringify({ status: 'applied' });
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed';
    return JSON.stringify({ error: message });
  }
}

export async function executeToolCall(
  db: SQLiteDatabase,
  toolName: string,
  args: ToolArgs,
  accountIds?: readonly string[],
): Promise<string> {
  const executor = EXECUTORS[toolName as ToolName];
  if (!executor) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  try {
    const result = await executor(db, args, accountIds);
    return JSON.stringify(result);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed';
    return JSON.stringify({ error: message });
  }
}

/** Build a human-readable status message for a tool call. */
export function getToolStatusMessage(toolName: string, args: ToolArgs): string {
  const startDate = String(args.start_date ?? '');
  const endDate = String(args.end_date ?? '');
  const range = startDate && endDate
    ? translate('ai.tool_status_range', { startDate, endDate })
    : '';

  switch (toolName) {
    case 'get_summary':
      return translate('ai.tool_status_summary', { range });
    case 'get_category_spending':
      return translate('ai.tool_status_category_spending', { range });
    case 'get_transactions':
      return translate('ai.tool_status_transactions', { range });
    case 'get_trends':
      return translate('ai.tool_status_trends', { range });
    case 'set_category_budget':
    case 'recategorize_transactions':
    case 'create_recurring_rule':
      return translate('ai.tool_status_confirm');
    default:
      return translate('ai.tool_status_default');
  }
}
