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
    exists: ['transactions', 'exists'] as const,
  },

  // ─── Accounts ───
  accounts: {
    all: ['accounts'] as const,
    withBalance: ['accounts', 'balance'] as const,
    withBalanceForMonth: (yearMonth: string) =>
      ['accounts', 'balance', yearMonth] as const,
    balanceSeries: (startDate: number, endDate: number, accountId?: string) =>
      ['accounts', 'balance', 'series', startDate, endDate, accountId] as const,
    netChanges: (startDate: number, endDate: number) =>
      ['accounts', 'balance', 'net-changes', startDate, endDate] as const,
    archived: ['accounts', 'archived'] as const,
    totalBalance: ['total-balance'] as const,
    totalBalanceForMonth: (yearMonth: string) =>
      ['total-balance', yearMonth] as const,
    summaryForRange: (accountId: string | undefined, startDate: number | undefined, endDate: number | undefined) =>
      ['accounts', 'summary-range', accountId, startDate, endDate] as const,
    summaryAll: ['accounts', 'summary-range'] as const,
  },

  // ─── Categories ───
  categories: {
    all: ['categories'] as const,
    usageAll: ['category-usage'] as const,
    usage: (id: string) => ['category-usage', id] as const,
  },

  // ─── Month Summary ───
  monthSummary: {
    all: ['month-summary'] as const,
    byMonth: (month: string) => ['month-summary', month] as const,
  },

  // ─── Insights ───
  insights: {
    all: ['insights'] as const,
    categorySpendRange: (startDate: number | undefined, endDate: number | undefined) =>
      ['insights', 'category-spend-range', startDate, endDate] as const,
    monthlyTrend: (months: number) =>
      ['insights', 'monthly-trend', months] as const,
    trendRange: (startDate: number | undefined, endDate: number | undefined) =>
      ['insights', 'trend-range', startDate, endDate] as const,
    yearlySummary: (year: number) =>
      ['insights', 'yearly-summary', year] as const,
    categorySpendYear: (year: number) =>
      ['insights', 'category-spend-year', year] as const,
    summaryRange: (startDate: number | undefined, endDate: number | undefined) =>
      ['insights', 'summary-range', startDate, endDate] as const,
    categoryMonthly: (categoryId: string, startDate: number, endDate: number) =>
      ['insights', 'category-monthly', categoryId, startDate, endDate] as const,
  },

  // ─── Currency Rates ───
  currencyRates: {
    all: ['currency-rates'] as const,
    lastFetchedAt: ['currency-rates', 'last-fetched-at'] as const,
    forDate: (unixSeconds: number) =>
      ['currency-rates', 'for-date', unixSeconds] as const,
  },

  // ─── Scheduled Transactions ───
  scheduledTransactions: {
    all: ['scheduled-transactions'] as const,
    detail: (id: string) =>
      ['scheduled-transactions', 'detail', id] as const,
    forTransaction: (transactionId: string) =>
      ['scheduled-transactions', 'for-transaction', transactionId] as const,
    paymentsAll: ['scheduled-transactions', 'payments'] as const,
    payments: (ruleId: string) =>
      ['scheduled-transactions', 'payments', ruleId] as const,
  },

  // ─── Recommendations ───
  recommendations: {
    all: ['recommendations'] as const,
    home: ['recommendations', 'home'] as const,
  },

  // ─── Settings › Delete data and row counts ───
  dataCounts: ['data-counts'] as const,

  // ─── OS notification permission ───
  canNotify: ['notifications', 'canNotify'] as const,

  // ─── Global Budget ───
  globalBudget: {
    all: ['global-budget'] as const,
    spend: (startDate: number, endDate: number) =>
      ['global-budget', 'spend', startDate, endDate] as const,
  },
} as const;
