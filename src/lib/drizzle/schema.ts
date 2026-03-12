import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const meta = sqliteTable('_meta', {
  key: text('key').primaryKey().notNull(),
  value: text('value'),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  currency: text('currency').notNull().default('EUR'),
  budget: integer('budget'),
  icon: text('icon'),
  color: text('color'),
  isArchived: integer('is_archived').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default('(datetime(\'now\'))'),
  updatedAt: text('updated_at').notNull().default('(datetime(\'now\'))'),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color').notNull(),
  defaultCurrency: text('default_currency').notNull().default('EUR'),
  type: text('type').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default('(datetime(\'now\'))'),
});

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey().notNull(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    categoryId: text('category_id').references(() => categories.id),
    type: text('type').notNull(),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('EUR'),
    date: text('date').notNull(),
    note: text('note'),
    createdAt: text('created_at').notNull().default('(datetime(\'now\'))'),
    updatedAt: text('updated_at').notNull().default('(datetime(\'now\'))'),
  },
  (t) => [
    index('idx_transactions_date').on(t.date),
    index('idx_transactions_account').on(t.accountId),
    index('idx_transactions_category').on(t.categoryId),
  ],
);

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  period: text('period').notNull(),
  amount: integer('amount').notNull(),
  startDate: text('start_date').notNull(),
  createdAt: text('created_at').notNull().default('(datetime(\'now\'))'),
  updatedAt: text('updated_at').notNull().default('(datetime(\'now\'))'),
});

export const budgetLines = sqliteTable(
  'budget_lines',
  {
    id: text('id').primaryKey().notNull(),
    budgetId: text('budget_id')
      .notNull()
      .references(() => budgets.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    amount: integer('amount').notNull(),
  },
  (t) => [unique().on(t.budgetId, t.categoryId)],
);

export const recurringRules = sqliteTable('recurring_rules', {
  id: text('id').primaryKey().notNull(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  categoryId: text('category_id').references(() => categories.id),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  note: text('note'),
  payee: text('payee'),
  frequency: text('frequency').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  nextDueDate: text('next_due_date').notNull(),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default('(datetime(\'now\'))'),
});

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  targetAmount: integer('target_amount').notNull(),
  currentAmount: integer('current_amount').notNull().default(0),
  deadline: text('deadline'),
  icon: text('icon'),
  color: text('color').notNull().default('#4ECDC4'),
  isCompleted: integer('is_completed').notNull().default(0),
  createdAt: text('created_at').notNull().default('(datetime(\'now\'))'),
  updatedAt: text('updated_at').notNull().default('(datetime(\'now\'))'),
});
