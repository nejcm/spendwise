import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from '@/features/currencies';
import type { TransactionType } from '@/features/transactions/types';

import { addDays, addMonths, addYears, startOfISOWeek, startOfMonth, startOfYear, subDays } from 'date-fns';
import { centsToAmount } from '@/features/formatting/helpers';
import { getCategorySpendByRange, getSummaryByRange, getTrendByRange } from '@/features/insights/queries';
import { getTransactionsSample } from '@/features/transactions/queries';
import { dateToUnix, unixToISODate } from '@/lib/date/helpers';
import { useAppStore } from '@/lib/store';

const AI_CONTEXT_DEFAULT_LOOKBACK_DAYS = 90;
const AI_CONTEXT_SHORT_LOOKBACK_DAYS = 30;
const AI_CONTEXT_TOP_CATEGORY_LIMIT = 5;
export const AI_CONTEXT_TRANSACTION_LIMIT = 12;
const AI_CONTEXT_TREND_POINT_LIMIT = 8;

const HARD_DETAIL_KEYWORDS = [
  'transaction',
  'transactions',
  'charge',
  'charges',
  'payment',
  'payments',
  'purchase',
  'purchases',
  'merchant',
  'merchants',
  'subscription',
  'subscriptions',
  'cancel',
  'find',
  'list',
  'example',
  'examples',
] as const;

const TREND_KEYWORDS = [
  'overview',
  'summary',
  'trend',
  'budget',
  'budgeting',
  'spending',
] as const;

const SOFT_DETAIL_KEYWORDS = [
  'recent',
  'latest',
] as const;

type AiRangePreset = 'this-week' | 'this-month' | 'last-month' | 'this-year' | 'last-year' | 'last-30-days' | 'last-90-days';

export type AiPromptContext = {
  asOf: string;
  displayCurrency: CurrencyKey;
  range: {
    preset: AiRangePreset;
    label: string;
    startDate: number;
    endDate: number;
    startDateISO: string;
    endDateExclusiveISO: string;
  };
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
  topCategories: Array<{
    name: string;
    total: number;
    percentage: number;
    type: 'income' | 'expense';
    budget: number | null;
  }>;
  trend?: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
  transactionSample?: {
    partial: true;
    notesIncluded: false;
    limit: number;
    count: number;
    rows: Array<{
      date: string;
      type: TransactionType;
      category: string | null;
      amount: number;
      currency: CurrencyKey;
      baseAmount: number;
      baseCurrency: CurrencyKey;
    }>;
  };
};

type AiQuestionIntent = {
  includeTransactions: boolean;
  includeTrend: boolean;
};

type ResolvedAiRange = {
  preset: AiRangePreset;
  label: string;
  startDate: number;
  endDate: number;
};

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfTodayExclusive(now: Date) {
  return addDays(startOfLocalDay(now), 1);
}

function containsKeyword(question: string, keywords: readonly string[]) {
  return keywords.some((keyword) => question.includes(keyword));
}

export function analyzeQuestionIntent(question: string): AiQuestionIntent {
  const normalizedQuestion = question.trim().toLowerCase();
  const includeTransactions = containsKeyword(normalizedQuestion, HARD_DETAIL_KEYWORDS)
    || (containsKeyword(normalizedQuestion, SOFT_DETAIL_KEYWORDS) && !containsKeyword(normalizedQuestion, TREND_KEYWORDS));
  const includeTrend = !includeTransactions || containsKeyword(normalizedQuestion, TREND_KEYWORDS);

  return { includeTransactions, includeTrend };
}

export function resolveQuestionRange(question: string, now = new Date()): ResolvedAiRange {
  const normalizedQuestion = question.trim().toLowerCase();
  const todayEndExclusive = endOfTodayExclusive(now);
  const last30Start = startOfLocalDay(subDays(now, AI_CONTEXT_SHORT_LOOKBACK_DAYS - 1));
  const last90Start = startOfLocalDay(subDays(now, AI_CONTEXT_DEFAULT_LOOKBACK_DAYS - 1));

  if (normalizedQuestion.includes('this week') || normalizedQuestion.includes('current week')) {
    const start = startOfISOWeek(now);
    return {
      preset: 'this-week',
      label: 'this week',
      startDate: dateToUnix(start),
      endDate: dateToUnix(addDays(start, 7)),
    };
  }

  if (normalizedQuestion.includes('last month')) {
    const start = addMonths(startOfMonth(now), -1);
    return {
      preset: 'last-month',
      label: 'last month',
      startDate: dateToUnix(start),
      endDate: dateToUnix(addMonths(start, 1)),
    };
  }

  if (normalizedQuestion.includes('this month') || normalizedQuestion.includes('current month') || normalizedQuestion.includes('monthly budget')) {
    const start = startOfMonth(now);
    return {
      preset: 'this-month',
      label: 'this month',
      startDate: dateToUnix(start),
      endDate: dateToUnix(addMonths(start, 1)),
    };
  }

  if (normalizedQuestion.includes('last year')) {
    const start = addYears(startOfYear(now), -1);
    return {
      preset: 'last-year',
      label: 'last year',
      startDate: dateToUnix(start),
      endDate: dateToUnix(addYears(start, 1)),
    };
  }

  if (normalizedQuestion.includes('this year') || normalizedQuestion.includes('current year')) {
    const start = startOfYear(now);
    return {
      preset: 'this-year',
      label: 'this year',
      startDate: dateToUnix(start),
      endDate: dateToUnix(addYears(start, 1)),
    };
  }

  if (normalizedQuestion.includes('recent') || normalizedQuestion.includes('lately') || normalizedQuestion.includes('latest')) {
    return {
      preset: 'last-30-days',
      label: 'the last 30 days',
      startDate: dateToUnix(last30Start),
      endDate: dateToUnix(todayEndExclusive),
    };
  }

  return {
    preset: 'last-90-days',
    label: 'the last 90 days',
    startDate: dateToUnix(last90Start),
    endDate: dateToUnix(todayEndExclusive),
  };
}

export async function buildAiPromptContext(
  db: SQLiteDatabase,
  question: string,
  now = new Date(),
): Promise<AiPromptContext> {
  const intent = analyzeQuestionIntent(question);
  const range = resolveQuestionRange(question, now);
  const displayCurrency = useAppStore.getState().currency;

  const [summary, categorySpend, trendRows, transactionRows] = await Promise.all([
    getSummaryByRange(db, range.startDate, range.endDate),
    getCategorySpendByRange(db, range.startDate, range.endDate),
    intent.includeTrend ? getTrendByRange(db, range.startDate, range.endDate) : Promise.resolve(undefined),
    intent.includeTransactions
      ? getTransactionsSample(db, range.startDate, range.endDate, AI_CONTEXT_TRANSACTION_LIMIT)
      : Promise.resolve(undefined),
  ]);

  const topCategories = categorySpend
    .filter((category) => category.total > 0)
    .sort((left, right) => right.total - left.total)
    .slice(0, AI_CONTEXT_TOP_CATEGORY_LIMIT)
    .map((category) => ({
      name: category.category_name,
      total: centsToAmount(category.total),
      percentage: Number(category.percentage.toFixed(1)),
      type: category.category_type,
      budget: category.category_budget === null ? null : centsToAmount(category.category_budget),
    }));

  return {
    asOf: now.toISOString(),
    displayCurrency,
    range: {
      ...range,
      startDateISO: unixToISODate(range.startDate),
      endDateExclusiveISO: unixToISODate(range.endDate),
    },
    summary: {
      income: centsToAmount(summary.income),
      expense: centsToAmount(summary.expense),
      balance: centsToAmount(summary.balance),
    },
    topCategories,
    trend: trendRows?.slice(-AI_CONTEXT_TREND_POINT_LIMIT).map((point) => ({
      date: unixToISODate(point.date),
      income: centsToAmount(point.income),
      expense: centsToAmount(point.expense),
    })),
    transactionSample: transactionRows
      ? {
          partial: true,
          notesIncluded: false,
          limit: AI_CONTEXT_TRANSACTION_LIMIT,
          count: transactionRows.length,
          rows: transactionRows.map((transaction) => ({
            date: unixToISODate(transaction.date),
            type: transaction.type,
            category: transaction.category_name,
            amount: centsToAmount(transaction.amount),
            currency: transaction.currency,
            baseAmount: centsToAmount(transaction.baseAmount),
            baseCurrency: transaction.baseCurrency,
          })),
        }
      : undefined,
  };
}
