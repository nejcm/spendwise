import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Category,
  MonthSummary,
  TransactionFormData,
  TransactionWithCategory,
} from './types';
import type { Account, AccountWithBalance } from '@/features/accounts/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import { amountToCents } from '@/lib/format';
import { generateId } from '@/lib/sqlite';

// ─── Query Keys ───

const keys = {
  transactions: ['transactions'] as const,
  transactionList: (month: string) => ['transactions', 'list', month] as const,
  transactionDetail: (id: string) => ['transactions', 'detail', id] as const,
  categories: ['categories'] as const,
  accounts: ['accounts'] as const,
  accountsWithBalance: ['accounts', 'balance'] as const,
  monthSummary: (month: string) => ['month-summary', month] as const,
  totalBalance: ['total-balance'] as const,
};

// ─── Transaction Queries ───

export function useTransactions(month: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.transactionList(month),
    queryFn: () => getTransactions(db, month),
  });
}

export function useTransaction(id: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.transactionDetail(id),
    queryFn: () => getTransactionById(db, id),
    enabled: !!id,
  });
}

export function useRecentTransactions(limit: number = 5) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: [...keys.transactions, 'recent', limit],
    queryFn: () => getRecentTransactions(db, limit),
  });
}

// ─── Category Queries ───

export function useCategories(type?: 'income' | 'expense') {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: [...keys.categories, type],
    queryFn: () => getCategories(db, type),
  });
}

// ─── Account Queries ───

export function useAccounts() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.accounts,
    queryFn: () => getAccounts(db),
  });
}

export function useAccountsWithBalance() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.accountsWithBalance,
    queryFn: () => getAccountsWithBalance(db),
  });
}

export function useTotalBalance() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.totalBalance,
    queryFn: () => getTotalBalance(db),
  });
}

// ─── Month Summary ───

export function useMonthSummary(month: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.monthSummary(month),
    queryFn: () => getMonthSummary(db, month),
  });
}

// ─── Category Mutations ───

type CategoryFormData = {
  name: string;
  type: 'expense' | 'income';
  color: string;
  sort_order: number;
};

export function useCreateCategory() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryFormData) => createCategory(db, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.categories });
    },
  });
}

export function useDeleteCategory() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.categories });
    },
  });
}

// ─── Mutations ───

export function useCreateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransactionFormData) => createTransaction(db, data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: keys.transactions });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
      queryClient.invalidateQueries({ queryKey: ['month-summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useUpdateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: TransactionFormData }) => updateTransaction(db, params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.transactions });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
      queryClient.invalidateQueries({ queryKey: ['month-summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useDeleteTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.transactions });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
      queryClient.invalidateQueries({ queryKey: ['month-summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

// ─── Database Functions ───

async function getTransactions(db: SQLiteDatabase, month: string): Promise<TransactionWithCategory[]> {
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01`;
  const nextMonth
    = Number(m) === 12 ? `${Number(year) + 1}-01-01` : `${year}-${String(Number(m) + 1).padStart(2, '0')}-01`;

  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.date >= ? AND t.date < ?
     ORDER BY t.date DESC, t.created_at DESC`,
    [startDate, nextMonth],
  );
}

async function getTransactionById(db: SQLiteDatabase, id: string): Promise<TransactionWithCategory | null> {
  return db.getFirstAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id],
  );
}

async function getRecentTransactions(db: SQLiteDatabase, limit: number): Promise<TransactionWithCategory[]> {
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT ?`,
    [limit],
  );
}

async function getCategories(db: SQLiteDatabase, type?: 'income' | 'expense'): Promise<Category[]> {
  if (type) {
    return db.getAllAsync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY sort_order ASC', [type]);
  }
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY type ASC, sort_order ASC');
}

async function getAccounts(db: SQLiteDatabase): Promise<Account[]> {
  return db.getAllAsync<Account>('SELECT * FROM accounts WHERE is_archived = 0 ORDER BY sort_order ASC');
}

async function getAccountsWithBalance(db: SQLiteDatabase): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       a.initial_balance
       + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
       as balance
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     WHERE a.is_archived = 0
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
  );
}

async function getTotalBalance(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT
       COALESCE(SUM(a.initial_balance), 0)
       + COALESCE(SUM(
           (SELECT COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
            FROM transactions t WHERE t.account_id = a.id)
         ), 0) as total
     FROM accounts a
     WHERE a.is_archived = 0`,
  );
  return result?.total ?? 0;
}

async function getMonthSummary(db: SQLiteDatabase, month: string): Promise<MonthSummary> {
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01`;
  const nextMonth
    = Number(m) === 12 ? `${Number(year) + 1}-01-01` : `${year}-${String(Number(m) + 1).padStart(2, '0')}-01`;

  const result = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?`,
    [startDate, nextMonth],
  );

  const income = result?.income ?? 0;
  const expense = result?.expense ?? 0;
  return { income, expense, balance: income - expense };
}

async function createTransaction(db: SQLiteDatabase, data: TransactionFormData): Promise<string> {
  const id = generateId();
  const amountCents = amountToCents(Number.parseFloat(data.amount) || 0);

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, date, note, payee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.account_id, data.category_id, data.type, amountCents, data.date, data.note || null, data.payee || null],
  );

  return id;
}

async function updateTransaction(db: SQLiteDatabase, id: string, data: TransactionFormData): Promise<void> {
  const amountCents = amountToCents(Number.parseFloat(data.amount) || 0);

  await db.runAsync(
    `UPDATE transactions
     SET account_id = ?, category_id = ?, type = ?, amount = ?, date = ?, note = ?, payee = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [data.account_id, data.category_id, data.type, amountCents, data.date, data.note || null, data.payee || null, id],
  );
}

async function deleteTransaction(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

async function createCategory(db: SQLiteDatabase, data: CategoryFormData): Promise<string> {
  const id = generateId();
  await db.runAsync(
    'INSERT INTO categories (id, name, color, type, is_default, sort_order) VALUES (?, ?, ?, ?, 0, ?)',
    [id, data.name.trim(), data.color, data.type, data.sort_order],
  );
  return id;
}

async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}
