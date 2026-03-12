import type { AccountFormData, AccountWithBalance } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { amountToCents } from '@/features/formatting/helpers';
import { db } from '@/lib/drizzle/db';
import { accounts, transactions } from '@/lib/drizzle/schema';

const keys = {
  accounts: ['accounts'] as const,
  accountsWithBalance: ['accounts', 'balance'] as const,
  totalBalance: ['total-balance'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: keys.accounts,
    queryFn: () => getAccounts(),
  });
}

export function useAccountsWithBalance() {
  return useQuery({
    queryKey: keys.accountsWithBalance,
    queryFn: () => getAccountsWithBalance(),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountFormData) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.accounts });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: AccountFormData }) =>
      updateAccount(params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.accounts });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.accounts });
      queryClient.invalidateQueries({ queryKey: keys.accountsWithBalance });
      queryClient.invalidateQueries({ queryKey: keys.totalBalance });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: TransferParams) => createTransfer(params),
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

async function getAccounts() {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.isArchived, 0))
    .orderBy(accounts.sortOrder);
}

async function getAccountsWithBalance(): Promise<AccountWithBalance[]> {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      description: accounts.description,
      type: accounts.type,
      currency: accounts.currency,
      budget: accounts.budget,
      icon: accounts.icon,
      color: accounts.color,
      is_archived: accounts.isArchived,
      sort_order: accounts.sortOrder,
      created_at: accounts.createdAt,
      updated_at: accounts.updatedAt,
      balance: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN ${transactions.type} = 'transfer' AND ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN ${transactions.type} = 'transfer' AND ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)
      `,
    })
    .from(accounts)
    .leftJoin(transactions, eq(transactions.accountId, accounts.id))
    .where(eq(accounts.isArchived, 0))
    .groupBy(accounts.id)
    .orderBy(accounts.sortOrder);

  return rows as AccountWithBalance[];
}

async function createAccount(data: AccountFormData): Promise<string> {
  const id = randomUUID();
  await db.insert(accounts).values({
    id,
    name: data.name,
    type: data.type,
    currency: data.currency,
    description: data.description,
    budget: data.budget ? amountToCents(Number.parseFloat(data.budget) || 0) : null,
    icon: data.icon,
    color: data.color,
  });
  return id;
}

async function updateAccount(id: string, data: AccountFormData): Promise<void> {
  await db
    .update(accounts)
    .set({
      name: data.name,
      type: data.type,
      currency: data.currency,
      description: data.description,
      budget: data.budget ? amountToCents(Number.parseFloat(data.budget) || 0) : null,
      icon: data.icon,
      color: data.color,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(accounts.id, id));
}

async function archiveAccount(id: string): Promise<void> {
  await db
    .update(accounts)
    .set({ isArchived: 1, updatedAt: sql`(datetime('now'))` })
    .where(eq(accounts.id, id));
}

async function createTransfer(params: TransferParams): Promise<void> {
  const { fromAccountId, toAccountId, amount, date, note } = params;
  const cents = amountToCents(Number.parseFloat(amount) || 0);

  await db.transaction(async (tx) => {
    await tx.insert(transactions).values({
      id: randomUUID(),
      accountId: fromAccountId,
      type: 'transfer',
      amount: -cents,
      date,
      note: note || null,
    });

    await tx.insert(transactions).values({
      id: randomUUID(),
      accountId: toAccountId,
      type: 'transfer',
      amount: cents,
      date,
      note: note || null,
    });
  });
}
