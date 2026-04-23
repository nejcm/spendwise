import type { SQLiteDatabase } from 'expo-sqlite';

import type { BudgetMonthlyHistory, BudgetOverviewItem, BudgetRolloverHistory, UnbudgetedCategory } from './types';

export async function getBudgetOverview(
  db: SQLiteDatabase,
  monthStart: number,
  monthEnd: number,
  prevYearMonth: number,
): Promise<BudgetOverviewItem[]> {
  return db.getAllAsync<BudgetOverviewItem>(
    `SELECT
       c.id AS category_id,
       c.name AS category_name,
       c.color AS category_color,
       c.icon AS category_icon,
       c.budget,
       c.budget_rollover,
       c.budget_alert_threshold,
       COALESCE(brh.rollover_amount, 0) AS rollover_amount,
       COALESCE(c.budget, 0) + COALESCE(brh.rollover_amount, 0) AS effective_budget,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0) AS spent
     FROM categories c
     LEFT JOIN budget_rollover_history brh
       ON brh.category_id = c.id AND brh.year_month = ?
     LEFT JOIN transactions t
       ON t.category_id = c.id
       AND t.type = 'expense'
       AND t.date >= ?
       AND t.date < ?
     WHERE c.budget IS NOT NULL AND c.budget > 0
     GROUP BY c.id`,
    [prevYearMonth, monthStart, monthEnd],
  );
}

export async function getUnbudgetedCategories(
  db: SQLiteDatabase,
): Promise<UnbudgetedCategory[]> {
  return db.getAllAsync<UnbudgetedCategory>(
    `SELECT
       id AS category_id,
       name AS category_name,
       color AS category_color,
       icon AS category_icon
     FROM categories
     WHERE budget IS NULL OR budget = 0
     ORDER BY sort_order ASC`,
  );
}

export async function getBudgetMonthlyHistory(
  db: SQLiteDatabase,
  categoryId: string,
  months: number = 6,
): Promise<BudgetMonthlyHistory[]> {
  return db.getAllAsync<BudgetMonthlyHistory>(
    `WITH RECURSIVE month_series AS (
       SELECT
         CAST(strftime('%Y%m', 'now', 'start of month') AS INTEGER) AS ym,
         strftime('%s', 'now', 'start of month') AS ms,
         strftime('%s', 'now', 'start of month', '+1 month') AS me,
         1 AS n
       UNION ALL
       SELECT
         CAST(strftime('%Y%m', datetime(CAST(ms AS INTEGER), 'unixepoch'), '-1 month') AS INTEGER),
         strftime('%s', datetime(CAST(ms AS INTEGER), 'unixepoch'), '-1 month'),
         ms,
         n + 1
       FROM month_series WHERE n < ?
     )
     SELECT
       ms.ym AS year_month,
       COALESCE(c.budget, 0) AS budget,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0) AS spent
     FROM month_series ms
     JOIN categories c ON c.id = ?
     LEFT JOIN transactions t
       ON t.category_id = c.id
       AND t.type = 'expense'
       AND t.date >= CAST(ms.ms AS INTEGER)
       AND t.date < CAST(ms.me AS INTEGER)
     GROUP BY ms.ym
     ORDER BY ms.ym ASC`,
    [months, categoryId],
  );
}

// eslint-disable-next-line max-params
export async function upsertBudgetRollover(
  db: SQLiteDatabase,
  id: string,
  categoryId: string,
  yearMonth: number,
  rolloverAmount: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO budget_rollover_history (id, category_id, year_month, rollover_amount)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(category_id, year_month) DO UPDATE SET rollover_amount = excluded.rollover_amount`,
    [id, categoryId, yearMonth, rolloverAmount],
  );
}

export async function getLastRolloverMonth(
  db: SQLiteDatabase,
  categoryId: string,
): Promise<number | null> {
  const row = await db.getFirstAsync<{ year_month: number }>(
    `SELECT year_month FROM budget_rollover_history WHERE category_id = ? ORDER BY year_month DESC LIMIT 1`,
    [categoryId],
  );
  return row?.year_month ?? null;
}

export async function getRolloverHistory(
  db: SQLiteDatabase,
  categoryId: string,
  limit: number = 3,
): Promise<BudgetRolloverHistory[]> {
  return db.getAllAsync<BudgetRolloverHistory>(
    `SELECT * FROM budget_rollover_history WHERE category_id = ? ORDER BY year_month DESC LIMIT ?`,
    [categoryId, limit],
  );
}
