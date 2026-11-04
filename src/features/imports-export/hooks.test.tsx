import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { invalidateFor } from '@/lib/data/invalidation';
import { act, renderHook, waitFor } from '@/lib/test-utils';
import { createTestDb } from '@/test-utils/sqlite-db';
import { useRestoreAutoBackup } from './hooks';

let mockDb: unknown;
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/lib/data/invalidation', () => ({ invalidateFor: jest.fn() }));
jest.mock('@/components/ui', () => ({
  Alert: { alert: jest.fn((_title: string, _message: string, buttons?: { onPress?: () => void }[]) => buttons?.at(-1)?.onPress?.()) },
}));

const backup = { version: 5, exported_at: '2026-01-01T00:00:00.000Z', accounts: [], categories: [], transactions: [], recurring_rules: [], recurring_rule_runs: [], transaction_tags: [] };

it('invalidates currency rates along with the restored entities', async () => {
  mockDb = await createTestDb();
  globalThis.fetch = jest.fn(async () => ({ text: async () => JSON.stringify(backup) })) as unknown as typeof fetch;
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useRestoreAutoBackup(), { wrapper });

  act(() => result.current.mutate('file://backup.json'));

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(invalidateFor).toHaveBeenCalledWith(client, 'transaction', 'account', 'category', 'scheduledTransaction', 'currencyRates');
});
