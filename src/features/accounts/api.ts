import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccountFormData } from './types';

import type { Account, AccountWithBalance } from '@/features/transactions/types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { amountToCents } from '@/lib/format';
import { generateId } from '@/lib/sqlite';

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

export function useCreateTransfer() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: TransferParams) => createTransfer(db, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.accounts });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['month-summary'] });
    },
  });
}

// ─── Types ───

type TransferParams = {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  date: string;
  note: string;
};

// ─── Database Functions ───

async function getAccounts(db: SQLiteDatabase): Promise<Account[]> {
  return db.getAllAsync<Account>(
    'SELECT * FROM accounts WHERE is_archived = 0 ORDER BY sort_order ASC',
  );
}

async function getAccountsWithBalance(db: SQLiteDatabase): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       a.initial_balance
       + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
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
  const balanceCents = amountToCents(Number.parseFloat(data.initial_balance) || 0);

  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency, initial_balance, icon, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.type, data.currency, balanceCents, data.icon, data.color],
  );

  return id;
}

async function updateAccount(db: SQLiteDatabase, id: string, data: AccountFormData): Promise<void> {
  const balanceCents = amountToCents(Number.parseFloat(data.initial_balance) || 0);

  await db.runAsync(
    `UPDATE accounts SET name = ?, type = ?, currency = ?, initial_balance = ?, icon = ?, color = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [data.name, data.type, data.currency, balanceCents, data.icon, data.color, id],
  );
}

async function archiveAccount(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'UPDATE accounts SET is_archived = 1, updated_at = datetime(\'now\') WHERE id = ?',
    [id],
  );
}

async function createTransfer(db: SQLiteDatabase, params: TransferParams): Promise<void> {
  const { fromAccountId, toAccountId, amount, date, note } = params;
  const cents = amountToCents(Number.parseFloat(amount) || 0);
  const transferId = generateId();
  const outId = generateId();
  const inId = generateId();

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, type, amount, date, note, transfer_id)
     VALUES (?, ?, 'transfer', ?, ?, ?, ?)`,
    [outId, fromAccountId, -cents, date, note || null, transferId],
  );

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, type, amount, date, note, transfer_id)
     VALUES (?, ?, 'transfer', ?, ?, ?, ?)`,
    [inId, toAccountId, cents, date, note || null, transferId],
  );
}
