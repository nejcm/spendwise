/**
 * Centralized React Query key registry.
 *
 * Every query key in the app is defined here — feature modules import from
 * this file instead of defining local `keys` objects. This gives us:
 * - Type-safe keys with autocomplete
 * - A single source of truth for cross-feature invalidation
 * - Compile-time typo detection
 */

export const queryKeys = {
  // ─── Transactions ───
  transactions: {
    all: ['transactions'] as const,
    list: (range: string) => ['transactions', 'list', range] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
    recent: (limit: number) => ['transactions', 'recent', limit] as const,
  },

  // ─── Accounts ───
  accounts: {
    all: ['accounts'] as const,
    withBalance: ['accounts', 'balance'] as const,
    withBalanceForMonth: (yearMonth: string) =>
      ['accounts', 'balance', yearMonth] as const,
    withBalanceForRange: (startDate: number, endDate: number) =>
      ['accounts', 'balance', startDate, endDate] as const,
    totalBalance: ['total-balance'] as const,
    totalBalanceForMonth: (yearMonth: string) =>
      ['total-balance', yearMonth] as const,
  },

  // ─── Categories ───
  categories: {
    all: ['categories'] as const,
  },

  // ─── Month Summary ───
  monthSummary: {
    all: ['month-summary'] as const,
    byMonth: (month: string) => ['month-summary', month] as const,
  },

  // ─── Budgets ───
  budgets: {
    all: ['budgets'] as const,
    detail: (id: string) => ['budgets', 'detail', id] as const,
    progress: (id: string, month: string) =>
      ['budgets', 'progress', id, month] as const,
    overview: (month: string) => ['budgets', 'overview', month] as const,
  },

  // ─── Insights ───
  insights: {
    all: ['insights'] as const,
    categorySpendRange: (startDate: number, endDate: number) =>
      ['insights', 'category-spend-range', startDate, endDate] as const,
    monthlyTrend: (months: number) =>
      ['insights', 'monthly-trend', months] as const,
    trendRange: (startDate: number, endDate: number) =>
      ['insights', 'trend-range', startDate, endDate] as const,
    yearlySummary: (year: number) =>
      ['insights', 'yearly-summary', year] as const,
    categorySpendYear: (year: number) =>
      ['insights', 'category-spend-year', year] as const,
    summaryRange: (startDate: number, endDate: number) =>
      ['insights', 'summary-range', startDate, endDate] as const,
  },

  // ─── Currency Rates ───
  currencyRates: {
    all: ['currency-rates'] as const,
  },

  // ─── Scheduled Transactions ───
  scheduledTransactions: {
    all: ['scheduled-transactions'] as const,
    detail: (id: string) =>
      ['scheduled-transactions', 'detail', id] as const,
  },
} as const;
