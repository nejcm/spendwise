// Tool definitions for AI providers.
// The AI calls these tools to fetch financial data on demand from local SQLite.

const TOOL_DESCRIPTIONS = {
  get_summary: 'Get income, expense, and balance totals for a date range. Use when the user asks about spending totals, income, savings, or balance for a period.',
  get_category_spending: 'Get per-category totals for a date range, in the returned currency. Each category has expense_total (money spent) and income_total (money received), reported separately and never combined; kind (expense or income) is the category\'s configured kind, metadata only. budget is the monthly budget limit or null. Use when the user asks about category-level spending, income sources, budgets, or where money goes.',
  get_transactions: 'Get a sample of individual transactions for a date range. Use when the user asks to list, find, or show specific transactions, charges, or purchases.',
  get_trends: 'Get daily income/expense trend data for a date range. Use when the user asks about spending trends, patterns over time, or day-by-day breakdown.',
} as const;

const AMOUNT_CENTS = { type: 'integer' as const, description: 'Positive amount in cents (minor units), e.g. 12500 for 125.00' };

// Write tools only propose a change; the app applies it after the user confirms in the chat.
const EXTRA_TOOLS = [
  {
    name: 'get_accounts_and_categories',
    description: 'List the user\'s accounts (id, name, currency) and categories (id, name, kind, monthly budget). Use to find the ids the change tools need.',
    schema: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'set_category_budget',
    description: 'Propose setting or removing a category\'s monthly budget limit (in the preferred currency). The user must confirm before it is saved.',
    schema: {
      type: 'object' as const,
      properties: {
        category_id: { type: 'string' as const, description: 'Category id from get_accounts_and_categories' },
        budget_cents: { type: ['integer', 'null'], description: 'New monthly budget in cents, or null to remove the budget' },
      },
      required: ['category_id', 'budget_cents'],
    },
  },
  {
    name: 'recategorize_transactions',
    description: 'Propose moving income or expense transactions to another category. Transfers cannot be moved, and the category kind must match each transaction type. The user must confirm before it is saved.',
    schema: {
      type: 'object' as const,
      properties: {
        transaction_ids: { type: 'array' as const, items: { type: 'string' as const }, description: 'Transaction ids from get_transactions' },
        category_id: { type: 'string' as const, description: 'Target category id from get_accounts_and_categories' },
      },
      required: ['transaction_ids', 'category_id'],
    },
  },
  {
    name: 'create_recurring_rule',
    description: 'Propose a recurring income or expense rule (bill, subscription, salary). The user must confirm before it is saved.',
    schema: {
      type: 'object' as const,
      properties: {
        account_id: { type: 'string' as const, description: 'Account id from get_accounts_and_categories' },
        category_id: { type: 'string' as const, description: 'Category id whose kind matches the type' },
        type: { type: 'string' as const, enum: ['income', 'expense'] },
        amount_cents: AMOUNT_CENTS,
        currency: { type: 'string' as const, description: 'ISO currency code, usually the account currency' },
        frequency: { type: 'string' as const, enum: ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'] },
        start_date: { type: 'string' as const, description: 'First occurrence in YYYY-MM-DD format' },
        note: { type: 'string' as const, description: 'Optional short name, e.g. Netflix' },
      },
      required: ['account_id', 'category_id', 'type', 'amount_cents', 'currency', 'frequency', 'start_date'],
    },
  },
] as const;

const DATE_RANGE_PROPERTIES = {
  start_date: {
    type: 'string' as const,
    description: 'Start date (inclusive) in YYYY-MM-DD format',
  },
  end_date: {
    type: 'string' as const,
    description: 'End date (exclusive) in YYYY-MM-DD format',
  },
};

const DATE_RANGE_REQUIRED = ['start_date', 'end_date'];

// ─── OpenAI Format ───

export const TOOL_DEFINITIONS_OPENAI = [
  {
    type: 'function' as const,
    function: {
      name: 'get_summary',
      description: TOOL_DESCRIPTIONS.get_summary,
      parameters: {
        type: 'object',
        properties: DATE_RANGE_PROPERTIES,
        required: DATE_RANGE_REQUIRED,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_category_spending',
      description: TOOL_DESCRIPTIONS.get_category_spending,
      parameters: {
        type: 'object',
        properties: DATE_RANGE_PROPERTIES,
        required: DATE_RANGE_REQUIRED,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_transactions',
      description: TOOL_DESCRIPTIONS.get_transactions,
      parameters: {
        type: 'object',
        properties: {
          ...DATE_RANGE_PROPERTIES,
          limit: {
            type: 'integer' as const,
            description: 'Maximum number of transactions to return (default 12, max 20)',
          },
        },
        required: DATE_RANGE_REQUIRED,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_trends',
      description: TOOL_DESCRIPTIONS.get_trends,
      parameters: {
        type: 'object',
        properties: DATE_RANGE_PROPERTIES,
        required: DATE_RANGE_REQUIRED,
      },
    },
  },
  ...EXTRA_TOOLS.map((tool) => ({
    type: 'function' as const,
    function: { name: tool.name, description: tool.description, parameters: tool.schema },
  })),
];

// ─── Anthropic Format ───

export const TOOL_DEFINITIONS_ANTHROPIC = [
  {
    name: 'get_summary',
    description: TOOL_DESCRIPTIONS.get_summary,
    input_schema: {
      type: 'object' as const,
      properties: DATE_RANGE_PROPERTIES,
      required: DATE_RANGE_REQUIRED,
    },
  },
  {
    name: 'get_category_spending',
    description: TOOL_DESCRIPTIONS.get_category_spending,
    input_schema: {
      type: 'object' as const,
      properties: DATE_RANGE_PROPERTIES,
      required: DATE_RANGE_REQUIRED,
    },
  },
  {
    name: 'get_transactions',
    description: TOOL_DESCRIPTIONS.get_transactions,
    input_schema: {
      type: 'object' as const,
      properties: {
        ...DATE_RANGE_PROPERTIES,
        limit: {
          type: 'integer' as const,
          description: 'Maximum number of transactions to return (default 12, max 20)',
        },
      },
      required: DATE_RANGE_REQUIRED,
    },
  },
  {
    name: 'get_trends',
    description: TOOL_DESCRIPTIONS.get_trends,
    input_schema: {
      type: 'object' as const,
      properties: DATE_RANGE_PROPERTIES,
      required: DATE_RANGE_REQUIRED,
    },
  },
  ...EXTRA_TOOLS.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.schema })),
];

export type WriteToolName = 'set_category_budget' | 'recategorize_transactions' | 'create_recurring_rule';
export type ToolName = 'get_summary' | 'get_category_spending' | 'get_transactions' | 'get_trends' | 'get_accounts_and_categories';
