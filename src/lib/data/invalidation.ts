import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from './query-keys';

/**
 * Entity types that can trigger cache invalidation.
 * Each maps to a set of query key prefixes that should be invalidated.
 */
type InvalidationEntity = keyof typeof INVALIDATION_RULES;

/**
 * Declarative invalidation rules.
 *
 * When an entity is mutated, all query keys listed under that entity are
 * invalidated via React Query's prefix matching. This replaces the manual
 * `queryClient.invalidateQueries({ queryKey: [...] })` calls scattered
 * across feature api.ts files.
 */
const INVALIDATION_RULES = {
  transaction: [
    queryKeys.transactions.all,
    queryKeys.tags.all,
    queryKeys.accounts.withBalance,
    queryKeys.accounts.summaryAll,
    queryKeys.accounts.totalBalance,
    queryKeys.monthSummary.all,
    queryKeys.insights.all,
    queryKeys.recommendations.all,
    queryKeys.globalBudget.all,
    queryKeys.categories.usageAll,
    queryKeys.accounts.usageAll,
    queryKeys.scheduledTransactions.paymentsAll,
    queryKeys.dataCounts,
  ],
  account: [
    queryKeys.transactions.all,
    queryKeys.accounts.all,
    queryKeys.accounts.withBalance,
    queryKeys.accounts.totalBalance,
    queryKeys.recommendations.all,
    queryKeys.dataCounts,
  ],
  category: [
    queryKeys.categories.all,
    queryKeys.categories.usageAll,
    queryKeys.insights.all,
    queryKeys.recommendations.all,
    queryKeys.dataCounts,
  ],
  scheduledTransaction: [
    queryKeys.scheduledTransactions.all,
    queryKeys.categories.usageAll,
    queryKeys.accounts.usageAll,
    queryKeys.recommendations.all,
    queryKeys.dataCounts,
  ],
  currencyRates: [
    queryKeys.currencyRates.all,
  ],
  globalBudget: [
    queryKeys.globalBudget.all,
  ],
  monthStartDay: [
    queryKeys.accounts.withBalance,
    queryKeys.accounts.totalBalance,
    queryKeys.monthSummary.all,
    queryKeys.insights.all,
    queryKeys.recommendations.all,
  ],
} as const;

/**
 * Invalidate all queries affected by the given entity mutations.
 * Deduplicates overlapping prefixes when multiple entities are passed.
 *
 * @example invalidateFor(queryClient, 'transaction')
 * @example invalidateFor(queryClient, 'scheduledTransaction', 'transaction')
 */
export function invalidateFor(
  queryClient: QueryClient,
  ...entities: readonly InvalidationEntity[]
): void {
  const seen = new Set<string>();

  for (const entity of entities) {
    const prefixes = INVALIDATION_RULES[entity];
    for (const prefix of prefixes) {
      const key = JSON.stringify(prefix);
      if (seen.has(key)) continue;
      seen.add(key);
      queryClient.invalidateQueries({ queryKey: prefix as readonly string[] });
    }
  }
}
