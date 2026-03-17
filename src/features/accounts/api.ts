import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccountFormData } from './types';
import type { Account, AccountWithBalance } from '@/features/accounts/types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { amountToCents } from '@/features/formatting/helpers';
import { generateId } from '@/lib/sqlite';

function budgetToCents(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? amountToCents(n) : null;
}

const keys = {
  accounts: ['accounts'] as const,
  accountsWithBalance: ['accounts', 'balance'] as const,
  totalBalance: ['total-balance'] as const,
};

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

export function useCreateAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountFormData) => createAccount(db, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.accounts });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
    },
  });
}

export function useUpdateAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: AccountFormData }) =>
      updateAccount(db, params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.accounts });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
    },
  });
}

export function useArchiveAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveAccount(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.accounts });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
    },
  });
}

// ─── Database Functions ───

async function getAccounts(db: SQLiteDatabase): Promise<Account[]> {
  return db.getAllAsync<Account>(
    'SELECT * FROM accounts WHERE is_archived = 0 ORDER BY sort_order ASC',
  );
}

async function getAccountsWithBalance(db: SQLiteDatabase): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)
       as balance
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     WHERE a.is_archived = 0
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
  );
}

async function createAccount(db: SQLiteDatabase, data: AccountFormData): Promise<string> {
  const id = generateId();

  const budgetCents = budgetToCents(data.budget);

  await db.runAsync(
    `INSERT INTO accounts (id, name, description, type, currency, budget, icon, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.description ?? null, data.type, data.currency, budgetCents, data.icon, data.color],
  );

  return id;
}

async function updateAccount(db: SQLiteDatabase, id: string, data: AccountFormData): Promise<void> {
  const budgetCents = budgetToCents(data.budget);

  await db.runAsync(
    `UPDATE accounts SET name = ?, description = ?, type = ?, currency = ?, budget = ?, icon = ?, color = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [data.name, data.description ?? null, data.type, data.currency, budgetCents, data.icon, data.color, id],
  );
}

async function archiveAccount(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'UPDATE accounts SET is_archived = 1, updated_at = datetime(\'now\') WHERE id = ?',
    [id],
  );
}
