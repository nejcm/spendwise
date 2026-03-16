import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category, CategoryFormData } from '../categories/types';
import type {
  MonthSummary,
  TransactionFormData,
  TransactionWithCategory,
} from './types';
import type { Account, AccountWithBalance } from '@/features/accounts/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { useSQLiteContext } from 'expo-sqlite';
import { amountToCents } from '@/features/formatting/helpers';
import { getCurrentMonthRange } from '@/lib/date/helpers';
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

export function useTransactions(startDate: string, endDate: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.transactionList(`${startDate}/${endDate}`),
    queryFn: () => getTransactions(db, startDate, endDate),
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

export function useCategories(_type?: 'income' | 'expense') {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: [...keys.categories],
    queryFn: () => getCategories(db),
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

export function useAccountsWithBalanceForMonth(yearMonth: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: [...keys.accountsWithBalance, yearMonth],
    queryFn: () => getAccountsWithBalanceForMonth(db, yearMonth),
  });
}

export function useAccountsWithBalanceForRange(startDate: string, endDate: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: [...keys.accountsWithBalance, startDate, endDate],
    queryFn: () => getAccountsWithBalanceForRange(db, startDate, endDate),
  });
}

export function useTotalBalance(yearMonth?: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: [...keys.totalBalance, yearMonth],
    queryFn: () => getTotalBalance(db, yearMonth),
  });
}

// ─── Month Summary ───

export function useMonthSummary(yearMonth: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.monthSummary(yearMonth),
    queryFn: () => getMonthSummary(db, yearMonth),
  });
}

// ─── Category Mutations ───

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

export function useDeleteCategory(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(db, id),
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: keys.categories });
    },
  });
}

export function useUpdateCategory() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: Pick<CategoryFormData, 'name' | 'icon' | 'color' | 'sort_order'> }) =>
      updateCategory(db, params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.categories });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useUpdateCategoryOrder() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ id: string; sort_order: number }>) =>
      updateCategoryOrder(db, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.categories });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
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

async function getTransactions(db: SQLiteDatabase, startDate: string, endDate: string): Promise<TransactionWithCategory[]> {
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.date >= ? AND t.date < ?
     ORDER BY t.date DESC, t.created_at DESC`,
    [startDate, endDate],
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

async function getCategories(db: SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY sort_order ASC');
}

async function getAccounts(db: SQLiteDatabase): Promise<Account[]> {
  return db.getAllAsync<Account>('SELECT * FROM accounts WHERE is_archived = 0 ORDER BY sort_order ASC');
}

async function getAccountsWithBalance(db: SQLiteDatabase): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
       as balance
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     WHERE a.is_archived = 0
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
  );
}

async function getAccountsWithBalanceForMonth(
  db: SQLiteDatabase,
  yearMonth: string,
): Promise<AccountWithBalance[]> {
  const [startDate, endDate] = getCurrentMonthRange(yearMonth);

  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)
       as balance
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
       AND t.date >= ? AND t.date < ?
     WHERE a.is_archived = 0
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
    [startDate, endDate],
  );
}

async function getAccountsWithBalanceForRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string,
): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)
       as balance
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
       AND t.date >= ? AND t.date < ?
     WHERE a.is_archived = 0
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
    [startDate, endDate],
  );
}

async function getTotalBalance(db: SQLiteDatabase, yearMonth?: string): Promise<number> {
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (yearMonth) {
    [startDate, endDate] = getCurrentMonthRange(yearMonth);
  }

  const sql = `
    SELECT
      COALESCE(SUM(account_balance), 0) as total
    FROM (
      SELECT
        a.id,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)
        AS account_balance
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      ${startDate && endDate ? 'AND t.date >= ? AND t.date < ?' : ''}
      WHERE a.is_archived = 0
      GROUP BY a.id
    ) AS balances
  `;

  const params: (string | number)[] = [];
  if (startDate && endDate) {
    params.push(startDate, endDate);
  }

  const result = await db.getFirstAsync<{ total: number }>(sql, params);
  return result?.total ?? 0;
}

async function getMonthSummary(db: SQLiteDatabase, yearMonth: string): Promise<MonthSummary> {
  const [startDate, endDate] = getCurrentMonthRange(yearMonth);

  const result = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?`,
    [startDate, endDate],
  );

  const income = result?.income ?? 0;
  const expense = result?.expense ?? 0;
  return { income, expense, balance: income - expense };
}

async function createTransaction(db: SQLiteDatabase, data: TransactionFormData): Promise<string> {
  const id = generateId();
  const amountCents = amountToCents(data.amount || 0);

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.account_id, data.category_id, data.type, amountCents, data.date, data.note || null],
  );

  return id;
}

async function updateTransaction(db: SQLiteDatabase, id: string, data: TransactionFormData): Promise<void> {
  const amountCents = amountToCents(data.amount || 0);

  await db.runAsync(
    `UPDATE transactions
     SET account_id = ?, category_id = ?, type = ?, amount = ?, date = ?, note = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [data.account_id, data.category_id, data.type, amountCents, data.date, data.note || null, id],
  );
}

async function deleteTransaction(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

async function createCategory(db: SQLiteDatabase, data: CategoryFormData): Promise<string> {
  const id = generateId();
  await db.runAsync(
    'INSERT INTO categories (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)',
    [id, data.name.trim(), data.icon?.trim() || null, data.color, data.sort_order ?? 999999],
  );
  return id;
}

async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  data: CategoryFormData,
): Promise<void> {
  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, sort_order = ? WHERE id = ?',
    [data.name.trim(), data.icon?.trim() || null, data.color, data.sort_order ?? 999999, id],
  );
}

async function updateCategoryOrder(
  db: SQLiteDatabase,
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync('UPDATE categories SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
  });
}
