import type { Category, CategoryFormData } from '../categories/types';

import type { MonthSummary, TransactionFormData, TransactionWithCategory } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import * as Haptics from 'expo-haptics';

import { amountToCents } from '@/features/formatting/helpers';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { db } from '@/lib/drizzle/db';
import { accounts, categories, transactions } from '@/lib/drizzle/schema';

export { useAccounts, useAccountsWithBalance } from '@/features/accounts/api';

// ─── Query Keys ───

const keys = {
  transactions: ['transactions'] as const,
  transactionList: (month: string) => ['transactions', 'list', month] as const,
  transactionDetail: (id: string) => ['transactions', 'detail', id] as const,
  categories: ['categories'] as const,
  monthSummary: (month: string) => ['month-summary', month] as const,
  totalBalance: ['total-balance'] as const,
};

// ─── Transaction Queries ───

export function useTransactions(month: string) {
  return useQuery({
    queryKey: keys.transactionList(month),
    queryFn: () => getTransactions(month),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: keys.transactionDetail(id),
    queryFn: () => getTransactionById(id),
    enabled: !!id,
  });
}

export function useRecentTransactions(limit: number = 5) {
  return useQuery({
    queryKey: [...keys.transactions, 'recent', limit],
    queryFn: () => getRecentTransactions(limit),
  });
}

// ─── Category Queries ───

export function useCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: [...keys.categories, type],
    queryFn: () => getCategories(type),
  });
}

// ─── Balance / Summary Queries ───

export function useTotalBalance(yearMonth?: string) {
  return useQuery({
    queryKey: [...keys.totalBalance, yearMonth],
    queryFn: () => getTotalBalance(yearMonth),
  });
}

export function useMonthSummary(yearMonth: string) {
  return useQuery({
    queryKey: keys.monthSummary(yearMonth),
    queryFn: () => getMonthSummary(yearMonth),
  });
}

// ─── Category Mutations ───

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryFormData) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      db.delete(categories).where(eq(categories.id, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.categories });
    },
  });
}

// ─── Mutations ───

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransactionFormData) => createTransaction(data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: keys.transactions });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'balance'] });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
      queryClient.invalidateQueries({ queryKey: ['month-summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: TransactionFormData }) =>
      updateTransaction(params.id, params.data),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: keys.transactions });
      queryClient.invalidateQueries({ queryKey: keys.transactionDetail(params.id) });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'balance'] });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
      queryClient.invalidateQueries({ queryKey: ['month-summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.delete(transactions).where(eq(transactions.id, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.transactions });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'balance'] });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
      queryClient.invalidateQueries({ queryKey: ['month-summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

// ─── Database Functions ───

async function getTransactions(month: string): Promise<TransactionWithCategory[]> {
  const [startDate, nextMonth] = getCurrentMonthRange(month);

  const rows = await db
    .select({
      id: transactions.id,
      account_id: transactions.accountId,
      category_id: transactions.categoryId,
      type: transactions.type,
      amount: transactions.amount,
      currency: transactions.currency,
      date: transactions.date,
      note: transactions.note,
      created_at: transactions.createdAt,
      updated_at: transactions.updatedAt,
      category_name: categories.name,
      category_icon: categories.icon,
      category_color: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(gte(transactions.date, startDate), lt(transactions.date, nextMonth)))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));

  return rows as TransactionWithCategory[];
}

async function getTransactionById(id: string): Promise<TransactionWithCategory | null> {
  const rows = await db
    .select({
      id: transactions.id,
      account_id: transactions.accountId,
      category_id: transactions.categoryId,
      type: transactions.type,
      amount: transactions.amount,
      currency: transactions.currency,
      date: transactions.date,
      note: transactions.note,
      created_at: transactions.createdAt,
      updated_at: transactions.updatedAt,
      category_name: categories.name,
      category_icon: categories.icon,
      category_color: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.id, id))
    .limit(1);

  return (rows[0] ?? null) as TransactionWithCategory | null;
}

async function getRecentTransactions(limit: number): Promise<TransactionWithCategory[]> {
  const rows = await db
    .select({
      id: transactions.id,
      account_id: transactions.accountId,
      category_id: transactions.categoryId,
      type: transactions.type,
      amount: transactions.amount,
      currency: transactions.currency,
      date: transactions.date,
      note: transactions.note,
      created_at: transactions.createdAt,
      updated_at: transactions.updatedAt,
      category_name: categories.name,
      category_icon: categories.icon,
      category_color: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit);

  return rows as TransactionWithCategory[];
}

async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const rows = type
    ? await db
        .select()
        .from(categories)
        .where(eq(categories.type, type))
        .orderBy(categories.sortOrder)
    : await db.select().from(categories).orderBy(categories.type, categories.sortOrder);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon ?? null,
    color: r.color,
    default_currency: r.defaultCurrency,
    type: r.type,
    sort_order: r.sortOrder,
    created_at: r.createdAt,
  })) as Category[];
}

async function getTotalBalance(yearMonth?: string): Promise<number> {
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (yearMonth) {
    [startDate, endDate] = getCurrentMonthRange(yearMonth);
  }

  const subquery = db
    .select({
      account_balance: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN ${transactions.type} = 'transfer' AND ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN ${transactions.type} = 'transfer' AND ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)
      `.as('account_balance'),
    })
    .from(accounts)
    .leftJoin(
      transactions,
      startDate && endDate
        ? and(
            eq(transactions.accountId, accounts.id),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
          )
        : eq(transactions.accountId, accounts.id),
    )
    .where(eq(accounts.isArchived, 0))
    .groupBy(accounts.id)
    .as('balances');

  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${subquery.account_balance}), 0)` })
    .from(subquery);

  return result[0]?.total ?? 0;
}

async function getMonthSummary(yearMonth: string): Promise<MonthSummary> {
  const [startDate, endDate] = getCurrentMonthRange(yearMonth);

  const result = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(and(gte(transactions.date, startDate), lt(transactions.date, endDate)));

  const income = result[0]?.income ?? 0;
  const expense = result[0]?.expense ?? 0;
  return { income, expense, balance: income - expense };
}

async function createTransaction(data: TransactionFormData): Promise<string> {
  const id = randomUUID();
  const amountCents = amountToCents(Number.parseFloat(data.amount) || 0);

  await db.insert(transactions).values({
    id,
    accountId: data.account_id,
    categoryId: data.category_id,
    type: data.type,
    amount: amountCents,
    date: data.date,
    note: data.note || null,
  });

  return id;
}

async function updateTransaction(id: string, data: TransactionFormData): Promise<void> {
  const amountCents = amountToCents(Number.parseFloat(data.amount) || 0);

  await db
    .update(transactions)
    .set({
      accountId: data.account_id,
      categoryId: data.category_id,
      type: data.type,
      amount: amountCents,
      date: data.date,
      note: data.note || null,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(transactions.id, id));
}

async function createCategory(data: CategoryFormData): Promise<string> {
  const id = randomUUID();
  await db.insert(categories).values({
    id,
    name: data.name.trim(),
    color: data.color,
    type: data.type,
    sortOrder: data.sort_order,
  });
  return id;
}
