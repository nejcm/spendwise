import type { Goal, GoalFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { amountToCents } from '@/features/formatting/helpers';
import { db } from '@/lib/drizzle/db';
import { goals, transactions } from '@/lib/drizzle/schema';

const keys = {
  goals: ['goals'] as const,
  goalDetail: (id: string) => ['goals', id] as const,
};

export function useGoals() {
  return useQuery({
    queryKey: keys.goals,
    queryFn: () => getGoals(),
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: keys.goalDetail(id),
    queryFn: () => getGoal(id),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GoalFormData) => createGoal(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.goals }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; data: GoalFormData }) =>
      updateGoal(params.id, params.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.goals }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.delete(goals).where(eq(goals.id, id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.goals }),
  });
}

export function useAddGoalContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { goalId: string; amount: string; accountId: string; date: string }) =>
      addContribution(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.goals });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['total-balance'] });
    },
  });
}

// ─── DB Functions ───

async function getGoals(): Promise<Goal[]> {
  const rows = await db
    .select()
    .from(goals)
    .orderBy(goals.isCompleted, sql`${goals.createdAt} DESC`);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    target_amount: r.targetAmount,
    current_amount: r.currentAmount,
    deadline: r.deadline ?? null,
    icon: r.icon ?? null,
    color: r.color,
    is_completed: r.isCompleted ? 1 : 0,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  })) as Goal[];
}

async function getGoal(id: string): Promise<Goal | null> {
  const rows = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  if (!rows[0]) return null;

  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    target_amount: r.targetAmount,
    current_amount: r.currentAmount,
    deadline: r.deadline ?? null,
    icon: r.icon ?? null,
    color: r.color,
    is_completed: r.isCompleted ? 1 : 0,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  } as Goal;
}

async function createGoal(data: GoalFormData): Promise<string> {
  const id = randomUUID();
  const cents = amountToCents(Number.parseFloat(data.target_amount) || 0);
  await db.insert(goals).values({
    id,
    name: data.name.trim(),
    targetAmount: cents,
    deadline: data.deadline || null,
    color: data.color,
  });
  return id;
}

async function updateGoal(id: string, data: GoalFormData): Promise<void> {
  const cents = amountToCents(Number.parseFloat(data.target_amount) || 0);
  await db
    .update(goals)
    .set({
      name: data.name.trim(),
      targetAmount: cents,
      deadline: data.deadline || null,
      color: data.color,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(goals.id, id));
}

type ContributionParams = {
  goalId: string;
  amount: string;
  accountId: string;
  date: string;
};

async function addContribution(params: ContributionParams): Promise<void> {
  const { goalId, amount, accountId, date } = params;
  const cents = amountToCents(Number.parseFloat(amount) || 0);

  await db.transaction(async (tx) => {
    await tx.insert(transactions).values({
      id: randomUUID(),
      accountId,
      type: 'expense',
      amount: cents,
      date,
      note: 'Goal contribution',
    });

    await tx
      .update(goals)
      .set({
        currentAmount: sql`${goals.currentAmount} + ${cents}`,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(goals.id, goalId));

    // Mark complete if reached
    await tx
      .update(goals)
      .set({ isCompleted: 1, updatedAt: sql`(datetime('now'))` })
      .where(
        sql`${goals.id} = ${goalId} AND ${goals.currentAmount} >= ${goals.targetAmount}`,
      );
  });
}
