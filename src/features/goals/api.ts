import type { SQLiteDatabase } from 'expo-sqlite';

import type { Goal, GoalFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { amountToCents } from '@/lib/format';
import { generateId } from '@/lib/sqlite';

const keys = {
  goals: ['goals'] as const,
  goalDetail: (id: string) => ['goals', id] as const,
};

export function useGoals() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.goals,
    queryFn: () => db.getAllAsync<Goal>(
      'SELECT * FROM goals ORDER BY is_completed ASC, created_at DESC',
    ),
  });
}

export function useGoal(id: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.goalDetail(id),
    queryFn: () => db.getFirstAsync<Goal>('SELECT * FROM goals WHERE id = ?', [id]),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GoalFormData) => createGoal(db, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.goals }),
  });
}

export function useUpdateGoal() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; data: GoalFormData }) =>
      updateGoal(db, params.id, params.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.goals }),
  });
}

export function useDeleteGoal() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.runAsync('DELETE FROM goals WHERE id = ?', [id]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.goals }),
  });
}

export function useAddGoalContribution() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { goalId: string; amount: string; accountId: string; date: string }) =>
      addContribution(db, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.goals });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['total-balance'] });
    },
  });
}

// ─── DB Functions ───

async function createGoal(db: SQLiteDatabase, data: GoalFormData): Promise<string> {
  const id = generateId();
  const cents = amountToCents(Number.parseFloat(data.target_amount) || 0);
  await db.runAsync(
    `INSERT INTO goals (id, name, target_amount, deadline, color)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.name.trim(), cents, data.deadline || null, data.color],
  );
  return id;
}

async function updateGoal(db: SQLiteDatabase, id: string, data: GoalFormData): Promise<void> {
  const cents = amountToCents(Number.parseFloat(data.target_amount) || 0);
  await db.runAsync(
    `UPDATE goals SET name = ?, target_amount = ?, deadline = ?, color = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [data.name.trim(), cents, data.deadline || null, data.color, id],
  );
}

type ContributionParams = {
  goalId: string;
  amount: string;
  accountId: string;
  date: string;
};

async function addContribution(db: SQLiteDatabase, params: ContributionParams): Promise<void> {
  const { goalId, amount, accountId, date } = params;
  const cents = amountToCents(Number.parseFloat(amount) || 0);
  const txId = generateId();

  // Create expense transaction tagged with goal
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, type, amount, date, note, goal_id)
     VALUES (?, ?, 'expense', ?, ?, 'Goal contribution', ?)`,
    [txId, accountId, cents, date, goalId],
  );

  // Update goal current_amount
  await db.runAsync(
    `UPDATE goals SET current_amount = current_amount + ?, updated_at = datetime('now')
     WHERE id = ?`,
    [cents, goalId],
  );

  // Mark complete if reached
  await db.runAsync(
    `UPDATE goals SET is_completed = 1, updated_at = datetime('now')
     WHERE id = ? AND current_amount >= target_amount`,
    [goalId],
  );
}
