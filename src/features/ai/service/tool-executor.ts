import type { SQLiteDatabase } from 'expo-sqlite';

import type { ToolName } from './tools';

import { centsToAmount } from '@/features/formatting/helpers';
import { getCategorySpendByRange, getSummaryByRange, getTrendByRange } from '@/features/insights/queries';
import { getTransactionsSample } from '@/features/transactions/queries';
import { dateToUnix, unixToISODate } from '@/lib/date/helpers';
import { useAppStore } from '@/lib/store/store';

const MAX_TRANSACTION_LIMIT = 20;
const DEFAULT_TRANSACTION_LIMIT = 12;

type ToolArgs = Record<string, unknown>;

function parseDateRange(args: ToolArgs): { startDate: number; endDate: number } {
  const startDate = dateToUnix(String(args.start_date));
  const endDate = dateToUnix(String(args.end_date));
  return { startDate, endDate };
}

async function executeSummary(db: SQLiteDatabase, args: ToolArgs) {
  const { startDate, endDate } = parseDateRange(args);
  const summary = await getSummaryByRange(db, startDate, endDate);
  const displayCurrency = useAppStore.getState().currency;

  return {
    currency: displayCurrency,
    income: centsToAmount(summary.income),
    expense: centsToAmount(summary.expense),
    balance: centsToAmount(summary.balance),
  };
}

async function executeCategorySpending(db: SQLiteDatabase, args: ToolArgs) {
  const { startDate, endDate } = parseDateRange(args);
  const rows = await getCategorySpendByRange(db, startDate, endDate);
  const displayCurrency = useAppStore.getState().currency;

  return {
    currency: displayCurrency,
    categories: rows
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((r) => ({
        name: r.category_name,
        total: centsToAmount(r.total),
        percentage: Number(r.percentage.toFixed(1)),
        type: r.category_type,
        budget: r.category_budget === null ? null : centsToAmount(r.category_budget),
      })),
  };
}

async function executeTransactions(db: SQLiteDatabase, args: ToolArgs) {
  const { startDate, endDate } = parseDateRange(args);
  const rawLimit = typeof args.limit === 'number' ? args.limit : DEFAULT_TRANSACTION_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_TRANSACTION_LIMIT);
  const rows = await getTransactionsSample(db, startDate, endDate, limit);
  const displayCurrency = useAppStore.getState().currency;

  return {
    currency: displayCurrency,
    count: rows.length,
    limit,
    transactions: rows.map((t) => ({
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

async function executeTrends(db: SQLiteDatabase, args: ToolArgs) {
  const { startDate, endDate } = parseDateRange(args);
  const rows = await getTrendByRange(db, startDate, endDate);
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

const EXECUTORS: Record<ToolName, (db: SQLiteDatabase, args: ToolArgs) => Promise<unknown>> = {
  get_summary: executeSummary,
  get_category_spending: executeCategorySpending,
  get_transactions: executeTransactions,
  get_trends: executeTrends,
};

export async function executeToolCall(
  db: SQLiteDatabase,
  toolName: string,
  args: ToolArgs,
): Promise<string> {
  const executor = EXECUTORS[toolName as ToolName];
  if (!executor) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  const result = await executor(db, args);
  return JSON.stringify(result);
}

/** Build a human-readable status message for a tool call. */
export function getToolStatusMessage(toolName: string, args: ToolArgs): string {
  const startDate = String(args.start_date ?? '');
  const endDate = String(args.end_date ?? '');
  const range = startDate && endDate ? ` (${startDate} to ${endDate})` : '';

  switch (toolName) {
    case 'get_summary':
      return `Looking up your financial summary${range}...`;
    case 'get_category_spending':
      return `Looking up category spending${range}...`;
    case 'get_transactions':
      return `Looking up transactions${range}...`;
    case 'get_trends':
      return `Looking up spending trends${range}...`;
    default:
      return 'Looking up your data...';
  }
}
