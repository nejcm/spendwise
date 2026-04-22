import type { SQLiteDatabase } from 'expo-sqlite';

import type { Recommendation } from './types';

import { addDays, format, startOfMonth, subMonths } from 'date-fns';
import { getAccountsWithBalance } from '@/features/accounts/queries';
import { getCategorySpendByRange } from '@/features/insights/queries';
import { getTransactions } from '@/features/transactions/queries';
import { dateToUnix } from '@/lib/date/helpers';

const LOOKBACK_MONTHS = 3;
const UPCOMING_WINDOW_DAYS = 7;
const UNUSUAL_RATIO = 1.75;
const CATEGORY_ANOMALY_RATIO = 1.35;
const MIN_HISTORY_TRANSACTIONS = 3;
const MIN_NON_ZERO_HISTORY_MONTHS = 2;
const MIN_CATEGORY_SHARE = 0.05;
const MEDIUM_CATEGORY_SHARE = 0.10;

type DueRuleRow = {
  id: string;
  account_id: string;
  account_name: string | null;
  account_currency: string | null;
  amount: number;
  currency: string;
  next_due_date: number;
  category_id: string | null;
  category_name: string | null;
  note: string | null;
};

function severityWeight(severity: Recommendation['severity']) {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

function recommendationId(kind: Recommendation['kind'], ...parts: Array<string | number | null | undefined>) {
  const suffix = parts
    .filter((part) => part !== null && part !== undefined && String(part).length > 0)
    .map((part) => String(part).replaceAll(':', '-'))
    .join(':');
  return suffix.length > 0 ? `${kind}:${suffix}` : kind;
}

function startOfCurrentMonthUnix(today: Date) {
  return dateToUnix(startOfMonth(today));
}

function startOfNextMonthUnix(today: Date) {
  return dateToUnix(startOfMonth(addDays(new Date(today.getFullYear(), today.getMonth() + 1, 1), 0)));
}

function startOfHistoryUnix(today: Date) {
  return dateToUnix(startOfMonth(subMonths(today, LOOKBACK_MONTHS)));
}

async function getDueExpenseRules(
  db: SQLiteDatabase,
  todayUnix: number,
  windowEndUnix: number,
): Promise<DueRuleRow[]> {
  return db.getAllAsync<DueRuleRow>(
    `SELECT
      r.id,
      r.account_id,
      a.name AS account_name,
      a.currency AS account_currency,
      r.amount,
      r.currency,
      r.next_due_date,
      r.category_id,
      c.name AS category_name,
      r.note
     FROM recurring_rules r
     LEFT JOIN accounts a ON a.id = r.account_id
     LEFT JOIN categories c ON c.id = r.category_id
     WHERE r.is_active = 1
       AND r.type = 'expense'
       AND r.next_due_date >= ?
       AND r.next_due_date <= ?
     ORDER BY r.next_due_date ASC, r.amount DESC`,
    [todayUnix, windowEndUnix],
  );
}

async function detectUpcomingCashflow(
  db: SQLiteDatabase,
  today: Date,
): Promise<Recommendation | null> {
  const todayUnix = dateToUnix(today);
  const windowEndUnix = dateToUnix(addDays(today, UPCOMING_WINDOW_DAYS));
  const [accounts, rules] = await Promise.all([
    getAccountsWithBalance(db),
    getDueExpenseRules(db, todayUnix, windowEndUnix),
  ]);

  const rulesByAccount = new Map<string, DueRuleRow[]>();
  for (const rule of rules) {
    const accountRules = rulesByAccount.get(rule.account_id) ?? [];
    accountRules.push(rule);
    rulesByAccount.set(rule.account_id, accountRules);
  }

  let best: Recommendation | null = null;

  for (const account of accounts) {
    const dueRules = (rulesByAccount.get(account.id) ?? [])
      .filter((rule) => rule.account_currency === rule.currency);
    if (dueRules.length === 0) continue;

    const dueTotal = dueRules.reduce((sum, rule) => sum + rule.amount, 0);
    const balance = account.balance ?? 0;
    const ratio = balance <= 0 ? 99 : dueTotal / balance;

    if (!(balance <= 0 || dueTotal >= balance || ratio >= 0.8)) {
      continue;
    }

    const recommendation: Recommendation = {
      id: recommendationId('upcoming_cashflow', account.id, format(today, 'yyyy-MM-dd')),
      kind: 'upcoming_cashflow',
      severity: balance <= 0 || dueTotal >= balance ? 'high' : 'medium',
      primaryTarget: 'accounts',
      accountId: account.id,
      accountName: account.name,
      amountCents: dueTotal,
      comparisonAmountCents: balance,
      currency: account.currency,
      count: dueRules.length,
      days: UPCOMING_WINDOW_DAYS,
      dueDate: dueRules[0]?.next_due_date ?? null,
      ratio,
      question: `My ${account.name} account has ${dueRules.length} upcoming bills in the next ${UPCOMING_WINDOW_DAYS} days. Help me understand the cashflow risk and what I should do next.`,
    };

    if (!best || severityWeight(recommendation.severity) > severityWeight(best.severity) || (recommendation.ratio ?? 0) > (best.ratio ?? 0)) {
      best = recommendation;
    }
  }

  return best;
}

async function detectSubscriptionReminder(
  db: SQLiteDatabase,
  today: Date,
): Promise<Recommendation | null> {
  const todayUnix = dateToUnix(today);
  const windowEndUnix = dateToUnix(addDays(today, UPCOMING_WINDOW_DAYS));
  const dueRules = await getDueExpenseRules(db, todayUnix, windowEndUnix);
  const nextRule = dueRules[0];

  if (!nextRule) return null;

  return {
    id: recommendationId('subscription_reminder', nextRule.id, nextRule.next_due_date),
    kind: 'subscription_reminder',
    severity: dueRules.length >= 2 ? 'medium' : 'low',
    primaryTarget: 'scheduled',
    accountId: nextRule.account_id,
    accountName: nextRule.account_name,
    categoryId: nextRule.category_id,
    categoryName: nextRule.category_name,
    label: nextRule.note?.trim() || nextRule.category_name || nextRule.account_name || null,
    amountCents: nextRule.amount,
    currency: nextRule.currency as Recommendation['currency'],
    dueDate: nextRule.next_due_date,
    count: dueRules.length,
    days: UPCOMING_WINDOW_DAYS,
    question: `I have a recurring bill coming up soon${nextRule.note ? ` for ${nextRule.note}` : ''}. Help me review whether it still looks necessary and how it fits into my spending.`,
  };
}

async function detectCategoryAnomaly(
  db: SQLiteDatabase,
  today: Date,
): Promise<Recommendation | null> {
  const monthStart = startOfMonth(today);
  const monthStartUnix = dateToUnix(monthStart);
  const nextMonthStartUnix = dateToUnix(new Date(today.getFullYear(), today.getMonth() + 1, 1));
  const previousRanges = Array.from({ length: LOOKBACK_MONTHS }, (_, index) => {
    const rangeStart = startOfMonth(subMonths(today, index + 1));
    return {
      start: dateToUnix(rangeStart),
      end: dateToUnix(new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 1)),
    };
  });

  const [currentRows, ...historyRows] = await Promise.all([
    getCategorySpendByRange(db, monthStartUnix, nextMonthStartUnix),
    ...previousRanges.map((range) => getCategorySpendByRange(db, range.start, range.end)),
  ]);

  const historyByCategory = new Map<string, number[]>();
  for (const rows of historyRows) {
    const rowMap = new Map(rows.map((row) => [row.category_id, row]));
    const categoryIds = new Set([
      ...historyByCategory.keys(),
      ...rowMap.keys(),
    ]);
    for (const categoryId of categoryIds) {
      const values = historyByCategory.get(categoryId) ?? [];
      values.push(rowMap.get(categoryId)?.expense_total ?? 0);
      historyByCategory.set(categoryId, values);
    }
  }

  let best: Recommendation | null = null;

  for (const row of currentRows) {
    const history: number[] = historyByCategory.get(row.category_id) ?? Array.from({ length: LOOKBACK_MONTHS }).fill(0) as number[];
    const average = history.reduce((sum, value) => sum + value, 0) / history.length;
    const ratio = average > 0 ? row.expense_total / average : 0;
    const nonZeroMonths = history.filter((v) => v > 0).length;

    if (average <= 0 || nonZeroMonths < MIN_NON_ZERO_HISTORY_MONTHS) continue;
    if (ratio < CATEGORY_ANOMALY_RATIO) continue;

    const recommendation: Recommendation = {
      id: recommendationId('category_anomaly', row.category_id, format(today, 'yyyy-MM')),
      kind: 'category_anomaly',
      severity: ratio >= 1.75 ? 'high' : 'medium',
      primaryTarget: 'stats',
      categoryId: row.category_id,
      categoryName: row.category_name,
      amountCents: row.expense_total,
      comparisonAmountCents: Math.round(average),
      ratio,
      question: `My ${row.category_name} spending is much higher this month than usual. Explain what likely changed and suggest concrete ways to bring it back down.`,
    };

    if (!best || (recommendation.ratio ?? 0) > (best.ratio ?? 0)) {
      best = recommendation;
    }
  }

  return best;
}

async function detectUnusualSpending(
  db: SQLiteDatabase,
  today: Date,
): Promise<Recommendation | null> {
  const monthStartUnix = startOfCurrentMonthUnix(today);
  const nextMonthStartUnix = startOfNextMonthUnix(today);
  const historyStartUnix = startOfHistoryUnix(today);
  const [currentTransactions, historyTransactions] = await Promise.all([
    getTransactions(db, monthStartUnix, nextMonthStartUnix),
    getTransactions(db, historyStartUnix, monthStartUnix),
  ]);

  const historyBySignature = new Map<string, number[]>();
  for (const transaction of historyTransactions) {
    if (transaction.type !== 'expense') continue;
    const signature = (transaction.note?.trim().toLowerCase() || `category:${transaction.category_id}`);
    const values = historyBySignature.get(signature) ?? [];
    values.push(transaction.baseAmount);
    historyBySignature.set(signature, values);
  }

  let best: Recommendation | null = null;

  for (const transaction of currentTransactions) {
    if (transaction.type !== 'expense') continue;
    const signature = (transaction.note?.trim().toLowerCase() || `category:${transaction.category_id}`);
    const history = historyBySignature.get(signature) ?? [];
    if (history.length < MIN_HISTORY_TRANSACTIONS) continue;

    const average = history.reduce((sum, value) => sum + value, 0) / history.length;
    const ratio = average > 0 ? transaction.baseAmount / average : 0;

    if (ratio < UNUSUAL_RATIO) continue;

    const label = transaction.note?.trim() || transaction.category_name || null;
    const recommendation: Recommendation = {
      id: recommendationId('unusual_spending', transaction.id),
      kind: 'unusual_spending',
      severity: ratio >= 2.5 ? 'high' : 'medium',
      primaryTarget: 'transactions',
      categoryId: transaction.category_id,
      categoryName: transaction.category_name,
      label,
      amountCents: transaction.baseAmount,
      comparisonAmountCents: Math.round(average),
      dueDate: transaction.date,
      ratio,
      question: `I made a much larger than usual purchase${label ? ` for ${label}` : ''}. Help me understand whether this looks like a one-off or part of a pattern, and suggest what to watch next.`,
    };

    if (!best || (recommendation.ratio ?? 0) > (best.ratio ?? 0)) {
      best = recommendation;
    }
  }

  return best;
}

async function detectBudgetSuggestion(
  db: SQLiteDatabase,
  today: Date,
): Promise<Recommendation | null> {
  const previousRanges = Array.from({ length: LOOKBACK_MONTHS }, (_, index) => {
    const rangeStart = startOfMonth(subMonths(today, index + 1));
    return {
      start: dateToUnix(rangeStart),
      end: dateToUnix(new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 1)),
    };
  });

  const historyRows = await Promise.all(previousRanges.map((range) => getCategorySpendByRange(db, range.start, range.end)));
  const monthlyTotals = historyRows.map((rows) => rows.reduce((sum, row) => sum + row.expense_total, 0));
  const averageMonthlyTotal
    = monthlyTotals.length > 0 ? monthlyTotals.reduce((sum, t) => sum + t, 0) / monthlyTotals.length : 0;
  const categories = new Map<string, { budget: number | null; name: string; totals: number[] }>();

  for (const rows of historyRows) {
    for (const row of rows) {
      const entry = categories.get(row.category_id) ?? {
        budget: row.category_budget,
        name: row.category_name,
        totals: [],
      };
      entry.budget = row.category_budget;
      entry.name = row.category_name;
      entry.totals.push(row.expense_total);
      categories.set(row.category_id, entry);
    }
  }

  let best: Recommendation | null = null;

  for (const [categoryId, category] of categories.entries()) {
    if (category.budget != null && category.budget > 0) continue;
    if (category.totals.length === 0) continue;

    const average = category.totals.reduce((sum, value) => sum + value, 0) / category.totals.length;
    const nonZeroMonths = category.totals.filter((v) => v > 0).length;

    if (nonZeroMonths < MIN_NON_ZERO_HISTORY_MONTHS) continue;
    if (averageMonthlyTotal <= 0 || average / averageMonthlyTotal < MIN_CATEGORY_SHARE) continue;

    const recommendation: Recommendation = {
      id: recommendationId('budget_suggestion', categoryId, format(today, 'yyyy-MM')),
      kind: 'budget_suggestion',
      severity: average / averageMonthlyTotal >= MEDIUM_CATEGORY_SHARE ? 'medium' : 'low',
      primaryTarget: 'categories',
      categoryId,
      categoryName: category.name,
      amountCents: Math.round(average),
      question: `My ${category.name} spending averages around this level each month. Help me set a realistic budget and tell me what number would make sense.`,
    };

    if (!best || (recommendation.amountCents ?? 0) > (best.amountCents ?? 0)) {
      best = recommendation;
    }
  }

  return best;
}

export async function getRecommendations(
  db: SQLiteDatabase,
  today: Date = new Date(),
): Promise<Recommendation[]> {
  const recommendations = await Promise.all([
    detectUpcomingCashflow(db, today),
    detectSubscriptionReminder(db, today),
    detectCategoryAnomaly(db, today),
    detectUnusualSpending(db, today),
    detectBudgetSuggestion(db, today),
  ]);

  return recommendations
    .filter((recommendation): recommendation is Recommendation => recommendation !== null)
    .sort((a, b) => {
      const severityDelta = severityWeight(b.severity) - severityWeight(a.severity);
      if (severityDelta !== 0) return severityDelta;
      return (b.amountCents ?? 0) - (a.amountCents ?? 0);
    });
}
