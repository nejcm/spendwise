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
    queryKeys.accounts.withBalance,
    queryKeys.accounts.totalBalance,
    queryKeys.monthSummary.all,
    queryKeys.insights.all,
  ],
  account: [
    queryKeys.accounts.all,
    queryKeys.accounts.withBalance,
    queryKeys.accounts.totalBalance,
  ],
  category: [
    queryKeys.categories.all,
    queryKeys.insights.all,
  ],
  budget: [
    queryKeys.budgets.all,
  ],
  scheduledTransaction: [
    queryKeys.scheduledTransactions.all,
  ],
  currencyRates: [
    queryKeys.currencyRates.all,
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
