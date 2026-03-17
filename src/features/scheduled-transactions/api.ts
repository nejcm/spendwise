import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ScheduledTransactionFormData,
  ScheduledTransactionWithDetails,
} from './types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { amountToCents, todayISO } from '@/features/formatting/helpers';
import { generateId } from '@/lib/sqlite';
import {
  getFirstDueOnOrAfter,
  processDueScheduledTransactions,
} from './scheduler';

const keys = {
  scheduledTransactions: ['scheduled-transactions'] as const,
  scheduledTransactionDetail: (id: string) =>
    ['scheduled-transactions', 'detail', id] as const,
};

function normalizeText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function deriveScheduleState(
  data: Pick<
    ScheduledTransactionFormData,
    'end_date' | 'frequency' | 'is_active' | 'start_date'
  >,
) {
  const nextDueDate = getFirstDueOnOrAfter({
    startDate: data.start_date,
    frequency: data.frequency,
    targetDate: todayISO(),
    endDate: data.end_date,
  });

  return {
    isActive: data.is_active && nextDueDate !== null,
    nextDueDate: nextDueDate ?? data.end_date ?? data.start_date,
  };
}

export function invalidateFinanceQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['accounts', 'balance'] });
  queryClient.invalidateQueries({ queryKey: ['total-balance'] });
  queryClient.invalidateQueries({ queryKey: ['month-summary'] });
  queryClient.invalidateQueries({ queryKey: ['insights'] });
}

export function invalidateScheduledTransactionQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: keys.scheduledTransactions });
}

export async function syncDueScheduledTransactions(
  db: SQLiteDatabase,
  queryClient: QueryClient,
  today: string = todayISO(),
): Promise<number> {
  const result = await processDueScheduledTransactions(db, today);

  if (result.createdTransactions > 0 || result.updatedRules > 0) {
    invalidateScheduledTransactionQueries(queryClient);
    invalidateFinanceQueries(queryClient);
  }

  return result.createdTransactions;
}

export function useScheduledTransactions() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.scheduledTransactions,
    queryFn: () => getScheduledTransactions(db),
  });
}

export function useScheduledTransaction(id: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.scheduledTransactionDetail(id),
    queryFn: () => getScheduledTransactionById(db, id),
    enabled: !!id,
  });
}

export function useCreateScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduledTransactionFormData) =>
      createScheduledTransaction(db, data),
    onSuccess: async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateScheduledTransactionQueries(queryClient);
      await syncDueScheduledTransactions(db, queryClient);
    },
  });
}

export function useUpdateScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: ScheduledTransactionFormData }) =>
      updateScheduledTransaction(db, params.id, params.data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.scheduledTransactionDetail(variables.id),
      });
      invalidateScheduledTransactionQueries(queryClient);
      await syncDueScheduledTransactions(db, queryClient);
    },
  });
}

export function useDeleteScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteScheduledTransaction(db, id),
    onSuccess: () => {
      invalidateScheduledTransactionQueries(queryClient);
    },
  });
}

async function getScheduledTransactions(
  db: SQLiteDatabase,
): Promise<ScheduledTransactionWithDetails[]> {
  return db.getAllAsync<ScheduledTransactionWithDetails>(
    `SELECT
      r.*,
      a.name AS account_name,
      a.icon AS account_icon,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color
     FROM recurring_rules r
     LEFT JOIN accounts a ON a.id = r.account_id
     LEFT JOIN categories c ON c.id = r.category_id
     ORDER BY r.is_active DESC, r.next_due_date ASC, r.created_at DESC`,
  );
}

async function getScheduledTransactionById(
  db: SQLiteDatabase,
  id: string,
): Promise<ScheduledTransactionWithDetails | null> {
  return db.getFirstAsync<ScheduledTransactionWithDetails>(
    `SELECT
      r.*,
      a.name AS account_name,
      a.icon AS account_icon,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color
     FROM recurring_rules r
     LEFT JOIN accounts a ON a.id = r.account_id
     LEFT JOIN categories c ON c.id = r.category_id
     WHERE r.id = ?`,
    [id],
  );
}

async function createScheduledTransaction(
  db: SQLiteDatabase,
  data: ScheduledTransactionFormData,
): Promise<string> {
  const id = generateId();
  const amount = amountToCents(Number(data.amount) || 0);
  const scheduleState = deriveScheduleState(data);

  await db.runAsync(
    `INSERT INTO recurring_rules (
      id,
      account_id,
      category_id,
      type,
      amount,
      currency,
      note,
      frequency,
      start_date,
      end_date,
      next_due_date,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.account_id,
      data.category_id,
      data.type,
      amount,
      data.currency,
      normalizeText(data.note),
      data.frequency,
      data.start_date,
      data.end_date || null,
      scheduleState.nextDueDate,
      Number(scheduleState.isActive),
    ],
  );

  return id;
}

async function updateScheduledTransaction(
  db: SQLiteDatabase,
  id: string,
  data: ScheduledTransactionFormData,
): Promise<void> {
  const amount = amountToCents(Number(data.amount) || 0);
  const scheduleState = deriveScheduleState(data);

  await db.runAsync(
    `UPDATE recurring_rules
     SET
       account_id = ?,
       category_id = ?,
       type = ?,
       amount = ?,
       currency = ?,
       note = ?,
       frequency = ?,
       start_date = ?,
       end_date = ?,
       next_due_date = ?,
       is_active = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    [
      data.account_id,
      data.category_id,
      data.type,
      amount,
      data.currency,
      normalizeText(data.note),
      data.frequency,
      data.start_date,
      data.end_date || null,
      scheduleState.nextDueDate,
      Number(scheduleState.isActive),
      id,
    ],
  );
}

async function deleteScheduledTransaction(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM recurring_rules WHERE id = ?', [id]);
}
