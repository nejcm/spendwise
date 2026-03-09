import type { SQLiteDatabase } from 'expo-sqlite';
import { addDays, format } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { storage } from '@/lib/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Keys to track which notifications have already been sent
function budgetAlertKey(budgetId: string, threshold: number, month: string) {
  return `notif.budget.${budgetId}.${threshold}.${month}`;
}

function ruleAlertKey(ruleId: string, dueDate: string) {
  return `notif.rule.${ruleId}.${dueDate}`;
}

function wasNotified(key: string): boolean {
  return storage.getString(key) === '1';
}

function markNotified(key: string): void {
  storage.set(key, '1');
}

export async function setupNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Default',
    });
  }
  await Notifications.requestPermissionsAsync();
}

async function canNotify(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function send(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { body, title },
    trigger: null,
  });
}

type BudgetRow = {
  budget_amount: number;
  id: string;
  name: string;
  total_spent: number;
};

export async function checkBudgetAlerts(db: SQLiteDatabase): Promise<void> {
  if (!(await canNotify())) {
    return;
  }

  const month = format(new Date(), 'yyyy-MM');

  const budgets = await db.getAllAsync<BudgetRow>(
    `SELECT b.id, b.name, b.amount AS budget_amount,
      COALESCE((
        SELECT SUM(ABS(t.amount))
        FROM transactions t
        JOIN budget_lines bl ON bl.category_id = t.category_id AND bl.budget_id = b.id
        WHERE t.type = 'expense' AND substr(t.date, 1, 7) = ?
      ), 0) AS total_spent
    FROM budgets b`,
    [month],
  );

  for (const budget of budgets) {
    const ratio = budget.budget_amount > 0 ? budget.total_spent / budget.budget_amount : 0;

    const key80 = budgetAlertKey(budget.id, 80, month);
    if (ratio >= 0.8 && ratio < 1.0 && !wasNotified(key80)) {
      await send(
        'Budget Alert',
        `"${budget.name}" is at ${Math.round(ratio * 100)}% of its budget.`,
      );
      markNotified(key80);
    }

    const key100 = budgetAlertKey(budget.id, 100, month);
    if (ratio >= 1.0 && !wasNotified(key100)) {
      await send('Budget Exceeded', `"${budget.name}" has gone over budget!`);
      markNotified(key100);
    }
  }
}

type RuleRow = {
  id: string;
  next_due_date: string;
  payee: string | null;
  category_name: string | null;
};

export async function checkUpcomingBills(db: SQLiteDatabase): Promise<void> {
  if (!(await canNotify())) {
    return;
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const inThreeDays = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  const rules = await db.getAllAsync<RuleRow>(
    `SELECT r.id, r.next_due_date, r.payee, c.name AS category_name
     FROM recurring_rules r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.is_active = 1 AND r.next_due_date >= ? AND r.next_due_date <= ?`,
    [today, inThreeDays],
  );

  for (const rule of rules) {
    const key = ruleAlertKey(rule.id, rule.next_due_date);
    if (!wasNotified(key)) {
      const name = rule.payee ?? rule.category_name ?? 'Bill';
      const isToday = rule.next_due_date === today;
      const body = isToday ? `${name} is due today.` : `${name} is due on ${rule.next_due_date}.`;
      await send('Upcoming Bill', body);
      markNotified(key);
    }
  }
}
