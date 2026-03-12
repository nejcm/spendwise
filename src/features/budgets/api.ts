import type { Budget, BudgetFormData, BudgetLineWithSpent, BudgetPeriod, BudgetWithProgress } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { desc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { amountToCents } from '@/features/formatting/helpers';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { db } from '@/lib/drizzle/db';
import { budgetLines, budgets, categories, transactions } from '@/lib/drizzle/schema';

const keys = {
  budgets: ['budgets'] as const,
  budgetDetail: (id: string) => ['budgets', 'detail', id] as const,
  budgetProgress: (id: string, month: string) => ['budgets', 'progress', id, month] as const,
};

export function useBudgets() {
  return useQuery({
    queryKey: keys.budgets,
    queryFn: () => getBudgets(),
  });
}

export function useBudgetWithProgress(id: string) {
  const month = format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: keys.budgetProgress(id, month),
    queryFn: () => getBudgetWithProgress(id, month),
    enabled: !!id,
  });
}

export function useBudgetsOverview() {
  const month = format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: [...keys.budgets, 'overview', month],
    queryFn: () => getBudgetsOverview(month),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BudgetFormData) => createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.budgets });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: BudgetFormData }) =>
      updateBudget(params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.budgets });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.delete(budgets).where(eq(budgets.id, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.budgets });
    },
  });
}

// ─── Database Functions ───

async function getBudgets(): Promise<Budget[]> {
  const rows = await db.select().from(budgets).orderBy(desc(budgets.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    period: r.period as BudgetPeriod,
    amount: r.amount,
    start_date: r.startDate,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }));
}

async function getBudgetWithProgress(id: string, month: string): Promise<BudgetWithProgress | null> {
  const rows = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
  if (!rows[0]) return null;

  const budget: Budget = {
    id: rows[0].id,
    name: rows[0].name,
    period: rows[0].period as BudgetPeriod,
    amount: rows[0].amount,
    start_date: rows[0].startDate,
    created_at: rows[0].createdAt,
    updated_at: rows[0].updatedAt,
  };

  const lines = await getBudgetLinesWithSpent(id, month);
  const totalSpent = lines.reduce((sum, l) => sum + l.spent, 0);
  return { ...budget, total_spent: totalSpent, lines };
}

async function getBudgetsOverview(month: string): Promise<BudgetWithProgress[]> {
  const allBudgets = await getBudgets();
  if (allBudgets.length === 0) return [];

  const [startDate, nextMonth] = getCurrentMonthRange(month);

  // Single query: all lines across all budgets with per-line spent
  const rows = await db
    .select({
      budget_id: budgetLines.budgetId,
      id: budgetLines.id,
      category_id: budgetLines.categoryId,
      amount: budgetLines.amount,
      category_name: categories.name,
      category_color: categories.color,
      category_icon: categories.icon,
      spent: sql<number>`COALESCE(
        (SELECT SUM(t.amount) FROM ${transactions} t
         WHERE t.category_id = ${budgetLines.categoryId}
         AND t.type = 'expense'
         AND t.date >= ${startDate} AND t.date < ${nextMonth}),
        0
      )`,
    })
    .from(budgetLines)
    .innerJoin(categories, eq(budgetLines.categoryId, categories.id));

  // Group lines by budgetId
  const linesByBudget = rows.reduce<Record<string, BudgetLineWithSpent[]>>((acc, row) => {
    const { budget_id, ...line } = row;
    acc[budget_id] = acc[budget_id] ?? [];
    acc[budget_id].push(line as BudgetLineWithSpent);
    return acc;
  }, {});

  return allBudgets.map((budget) => {
    const lines = linesByBudget[budget.id] ?? [];
    return { ...budget, total_spent: lines.reduce((s, l) => s + l.spent, 0), lines };
  });
}

async function getBudgetLinesWithSpent(budgetId: string, month: string): Promise<BudgetLineWithSpent[]> {
  const [startDate, nextMonth] = getCurrentMonthRange(month);

  const rows = await db
    .select({
      id: budgetLines.id,
      budget_id: budgetLines.budgetId,
      category_id: budgetLines.categoryId,
      amount: budgetLines.amount,
      category_name: categories.name,
      category_color: categories.color,
      category_icon: categories.icon,
      spent: sql<number>`COALESCE(
        (SELECT SUM(t.amount) FROM ${transactions} t
         WHERE t.category_id = ${budgetLines.categoryId}
         AND t.type = 'expense'
         AND t.date >= ${startDate} AND t.date < ${nextMonth}),
        0
      )`,
    })
    .from(budgetLines)
    .innerJoin(categories, eq(budgetLines.categoryId, categories.id))
    .where(eq(budgetLines.budgetId, budgetId))
    .orderBy(desc(budgetLines.amount));

  return rows as BudgetLineWithSpent[];
}

async function createBudget(data: BudgetFormData): Promise<string> {
  const id = randomUUID();
  const totalCents = amountToCents(data.amount || 0);

  await db.transaction(async (tx) => {
    await tx.insert(budgets).values({
      id,
      name: data.name,
      period: data.period,
      amount: totalCents,
      startDate: format(new Date(), 'yyyy-MM-dd'),
    });

    for (const line of data.lines) {
      const lineCents = amountToCents(line.amount || 0);
      if (lineCents > 0) {
        await tx.insert(budgetLines).values({
          id: randomUUID(),
          budgetId: id,
          categoryId: line.category_id,
          amount: lineCents,
        });
      }
    }
  });

  return id;
}

async function updateBudget(id: string, data: BudgetFormData): Promise<void> {
  const totalCents = amountToCents(data.amount || 0);

  await db.transaction(async (tx) => {
    await tx
      .update(budgets)
      .set({
        name: data.name,
        period: data.period,
        amount: totalCents,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(budgets.id, id));

    await tx.delete(budgetLines).where(eq(budgetLines.budgetId, id));

    for (const line of data.lines) {
      const lineCents = amountToCents(line.amount || 0);
      if (lineCents > 0) {
        await tx.insert(budgetLines).values({
          id: randomUUID(),
          budgetId: id,
          categoryId: line.category_id,
          amount: lineCents,
        });
      }
    }
  });
}
