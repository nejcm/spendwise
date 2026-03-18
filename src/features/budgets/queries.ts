import type { SQLiteDatabase } from 'expo-sqlite';

import type { Budget, BudgetFormData, BudgetLineWithSpent, BudgetWithProgress } from './types';

import { amountToCents } from '@/features/formatting/helpers';
import { generateId } from '@/lib/sqlite';

// ─── Read Queries ───

export async function getBudgets(db: SQLiteDatabase): Promise<Budget[]> {
  return db.getAllAsync<Budget>('SELECT * FROM budgets ORDER BY created_at DESC');
}

export async function getBudgetWithProgress(
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

export async function getBudgetsOverview(
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

export async function getBudgetLinesWithSpent(
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

// ─── Write Queries ───

export async function createBudget(
  db: SQLiteDatabase,
  data: BudgetFormData,
): Promise<string> {
  const id = generateId();
  const totalCents = amountToCents(data.amount || 0);

  const { format } = await import('date-fns');

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

export async function updateBudget(
  db: SQLiteDatabase,
  id: string,
  data: BudgetFormData,
): Promise<void> {
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

export async function deleteBudget(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}
