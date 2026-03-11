import type { SQLiteDatabase } from 'expo-sqlite';

import type { Budget, BudgetFormData, BudgetLineWithSpent, BudgetWithProgress } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';

import { amountToCents } from '@/features/formatting/helpers';
import { generateId } from '@/lib/sqlite';

const keys = {
  budgets: ['budgets'] as const,
  budgetDetail: (id: string) => ['budgets', 'detail', id] as const,
  budgetProgress: (id: string, month: string) => ['budgets', 'progress', id, month] as const,
};

export function useBudgets() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.budgets,
    queryFn: () => getBudgets(db),
  });
}

export function useBudgetWithProgress(id: string) {
  const db = useSQLiteContext();
  const month = format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: keys.budgetProgress(id, month),
    queryFn: () => getBudgetWithProgress(db, id, month),
    enabled: !!id,
  });
}

export function useBudgetsOverview() {
  const db = useSQLiteContext();
  const month = format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: [...keys.budgets, 'overview', month],
    queryFn: () => getBudgetsOverview(db, month),
  });
}

export function useCreateBudget() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BudgetFormData) => createBudget(db, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.budgets });
    },
  });
}

export function useUpdateBudget() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: BudgetFormData }) =>
      updateBudget(db, params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.budgets });
    },
  });
}

export function useDeleteBudget() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBudget(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.budgets });
    },
  });
}

// ─── Database Functions ───

async function getBudgets(db: SQLiteDatabase): Promise<Budget[]> {
  return db.getAllAsync<Budget>('SELECT * FROM budgets ORDER BY created_at DESC');
}

async function getBudgetWithProgress(
  db: SQLiteDatabase,
  id: string,
  month: string,
): Promise<BudgetWithProgress | null> {
  const budget = await db.getFirstAsync<Budget>('SELECT * FROM budgets WHERE id = ?', [id]);
  if (!budget) {
    return null;
  }

  const lines = await getBudgetLinesWithSpent(db, id, month);
  const totalSpent = lines.reduce((sum, l) => sum + l.spent, 0);

  return { ...budget, total_spent: totalSpent, lines };
}

async function getBudgetsOverview(
  db: SQLiteDatabase,
  month: string,
): Promise<BudgetWithProgress[]> {
  const budgets = await getBudgets(db);
  const result: BudgetWithProgress[] = [];

  for (const budget of budgets) {
    const lines = await getBudgetLinesWithSpent(db, budget.id, month);
    const totalSpent = lines.reduce((sum, l) => sum + l.spent, 0);
    result.push({ ...budget, total_spent: totalSpent, lines });
  }

  return result;
}

async function getBudgetLinesWithSpent(
  db: SQLiteDatabase,
  budgetId: string,
  month: string,
): Promise<BudgetLineWithSpent[]> {
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01`;
  const nextMonth = Number(m) === 12
    ? `${Number(year) + 1}-01-01`
    : `${year}-${String(Number(m) + 1).padStart(2, '0')}-01`;

  return db.getAllAsync<BudgetLineWithSpent>(
    `SELECT bl.*,
       c.name as category_name,
       c.color as category_color,
       c.icon as category_icon,
       COALESCE(
         (SELECT SUM(t.amount) FROM transactions t
          WHERE t.category_id = bl.category_id
          AND t.type = 'expense'
          AND t.date >= ? AND t.date < ?),
         0
       ) as spent
     FROM budget_lines bl
     JOIN categories c ON bl.category_id = c.id
     WHERE bl.budget_id = ?
     ORDER BY bl.amount DESC`,
    [startDate, nextMonth, budgetId],
  );
}

async function createBudget(db: SQLiteDatabase, data: BudgetFormData): Promise<string> {
  const id = generateId();
  const totalCents = amountToCents(data.amount || 0);

  await db.runAsync(
    `INSERT INTO budgets (id, name, period, amount, start_date)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.name, data.period, totalCents, format(new Date(), 'yyyy-MM-dd')],
  );

  for (const line of data.lines) {
    const lineId = generateId();
    const lineCents = amountToCents(line.amount || 0);
    if (lineCents > 0) {
      await db.runAsync(
        'INSERT INTO budget_lines (id, budget_id, category_id, amount) VALUES (?, ?, ?, ?)',
        [lineId, id, line.category_id, lineCents],
      );
    }
  }

  return id;
}

async function updateBudget(db: SQLiteDatabase, id: string, data: BudgetFormData): Promise<void> {
  const totalCents = amountToCents(data.amount || 0);

  await db.runAsync(
    'UPDATE budgets SET name = ?, period = ?, amount = ?, updated_at = datetime(\'now\') WHERE id = ?',
    [data.name, data.period, totalCents, id],
  );

  await db.runAsync('DELETE FROM budget_lines WHERE budget_id = ?', [id]);

  for (const line of data.lines) {
    const lineId = generateId();
    const lineCents = amountToCents(line.amount || 0);
    if (lineCents > 0) {
      await db.runAsync(
        'INSERT INTO budget_lines (id, budget_id, category_id, amount) VALUES (?, ?, ?, ?)',
        [lineId, id, line.category_id, lineCents],
      );
    }
  }
}

async function deleteBudget(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}
