import type { SQLiteDatabase } from 'expo-sqlite';

import type { Goal, GoalFormData } from './types';

import { amountToCents } from '@/features/formatting/helpers';
import { generateId } from '@/lib/sqlite';

export async function getGoals(db: SQLiteDatabase): Promise<Goal[]> {
  return db.getAllAsync<Goal>(
    'SELECT * FROM goals ORDER BY is_completed ASC, created_at DESC',
  );
}

export async function getGoalById(
  db: SQLiteDatabase,
  id: string,
): Promise<Goal | null> {
  return db.getFirstAsync<Goal>('SELECT * FROM goals WHERE id = ?', [id]);
}

export async function createGoal(
  db: SQLiteDatabase,
  data: GoalFormData,
): Promise<string> {
  const id = generateId();
  const cents = amountToCents(Number.parseFloat(data.target_amount) || 0);
  await db.runAsync(
    `INSERT INTO goals (id, name, target_amount, deadline, color)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.name.trim(), cents, data.deadline || null, data.color],
  );
  return id;
}

export async function updateGoal(
  db: SQLiteDatabase,
  id: string,
  data: GoalFormData,
): Promise<void> {
  const cents = amountToCents(Number.parseFloat(data.target_amount) || 0);
  await db.runAsync(
    `UPDATE goals SET name = ?, target_amount = ?, deadline = ?, color = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [data.name.trim(), cents, data.deadline || null, data.color, id],
  );
}

export async function deleteGoal(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
}

type ContributionParams = {
  goalId: string;
  amount: string;
  accountId: string;
  date: string;
};

export async function addContribution(
  db: SQLiteDatabase,
  params: ContributionParams,
): Promise<void> {
  const { goalId, amount, accountId, date } = params;
  const cents = amountToCents(Number.parseFloat(amount) || 0);
  const txId = generateId();

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, type, amount, date, note, goal_id)
     VALUES (?, ?, 'expense', ?, ?, 'Goal contribution', ?)`,
    [txId, accountId, cents, date, goalId],
  );

  await db.runAsync(
    `UPDATE goals SET current_amount = current_amount + ?, updated_at = datetime('now')
     WHERE id = ?`,
    [cents, goalId],
  );

  await db.runAsync(
    `UPDATE goals SET is_completed = 1, updated_at = datetime('now')
     WHERE id = ? AND current_amount >= target_amount`,
    [goalId],
  );
}
