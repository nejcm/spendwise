// Tool definitions for AI providers.
// The AI calls these tools to fetch financial data on demand from local SQLite.

const TOOL_DESCRIPTIONS = {
  get_summary: 'Get income, expense, and balance totals for a date range. Use when the user asks about spending totals, income, savings, or balance for a period.',
  get_category_spending: 'Get spending breakdown by category for a date range. Use when the user asks about category-level spending, budgets, or where money goes.',
  get_transactions: 'Get a sample of individual transactions for a date range. Use when the user asks to list, find, or show specific transactions, charges, or purchases.',
  get_trends: 'Get daily income/expense trend data for a date range. Use when the user asks about spending trends, patterns over time, or day-by-day breakdown.',
} as const;

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
];

export type ToolName = 'get_summary' | 'get_category_spending' | 'get_transactions' | 'get_trends';
