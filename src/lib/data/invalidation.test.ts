import type { QueryClient } from '@tanstack/react-query';

import { invalidateFor } from './invalidation';
import { queryKeys } from './query-keys';

function createMockQueryClient(): QueryClient & { invalidatedKeys: readonly unknown[][] } {
  const invalidatedKeys: readonly unknown[][] = [];
  return {
    invalidatedKeys,
    invalidateQueries: jest.fn(({ queryKey }: { queryKey: readonly unknown[] }) => {
      (invalidatedKeys as unknown[][]).push([...queryKey]);
      return Promise.resolve();
    }),
  } as unknown as QueryClient & { invalidatedKeys: readonly unknown[][] };
}

describe('invalidateFor', () => {
  it('invalidates all transaction-related query prefixes', () => {
    const qc = createMockQueryClient();
    invalidateFor(qc, 'transaction');

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(5);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.transactions.all]);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.accounts.withBalance]);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.accounts.totalBalance]);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.monthSummary.all]);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.insights.all]);
  });

  it('deduplicates overlapping prefixes when multiple entities are passed', () => {
    const qc = createMockQueryClient();
    invalidateFor(qc, 'transaction', 'account');

    const keyStrings = qc.invalidatedKeys.map((k) => JSON.stringify(k));
    const unique = new Set(keyStrings);
    expect(keyStrings.length).toBe(unique.size);
  });

  it('invalidates account-related prefixes for account entity', () => {
    const qc = createMockQueryClient();
    invalidateFor(qc, 'account');

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.accounts.all]);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.accounts.withBalance]);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.accounts.totalBalance]);
  });

  it('invalidates category and insights for category entity', () => {
    const qc = createMockQueryClient();
    invalidateFor(qc, 'category');

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.categories.all]);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.insights.all]);
  });

  it('handles single-key entities', () => {
    const qc = createMockQueryClient();
    invalidateFor(qc, 'scheduledTransaction');

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(qc.invalidatedKeys).toContainEqual([...queryKeys.scheduledTransactions.all]);
  });
});
