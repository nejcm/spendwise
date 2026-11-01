import type { DeletedScheduledTransaction } from './queries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { getAppState, updateNotifications } from '@/lib/store/store';
import { act, renderHook, waitFor } from '@/lib/test-utils';
import { useDeleteScheduledTransaction } from './hooks';

const mockDelete = jest.fn<(db: unknown, arg: string) => Promise<DeletedScheduledTransaction>>();
const mockRestore = jest.fn<(db: unknown, arg: DeletedScheduledTransaction) => Promise<void>>();
const mockShowSnackbar = jest.fn();

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('./queries', () => ({
  deleteScheduledTransaction: (...args: [unknown, string]) => mockDelete(...args),
  restoreScheduledTransaction: (...args: [unknown, DeletedScheduledTransaction]) => mockRestore(...args),
}));
jest.mock('./scheduler', () => ({ processDueScheduledTransactions: async () => ({ createdTransactions: 0, updatedRules: 0 }) }));
jest.mock('@/components/ui/snackbar', () => ({ showSnackbar: (options: unknown) => mockShowSnackbar(options) }));
jest.mock('@/components/ui', () => ({ Alert: { alert: jest.fn() } }));

const snapshot = { rule: { id: 'rule_1' }, runs: [] } as unknown as DeletedScheduledTransaction;
const mutedRules = () => getAppState().notifications.mutedBillRules ?? [];

function renderDelete() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useDeleteScheduledTransaction(), { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  updateNotifications({ mutedBillRules: ['rule_1', 'rule_2'] });
});

describe('useDeleteScheduledTransaction', () => {
  it('drops the mute on delete and re-mutes before the restore write, even after unmount', async () => {
    let mutedDuringRestore: string[] = [];
    mockRestore.mockImplementation(async () => {
      mutedDuringRestore = mutedRules();
    });
    mockDelete.mockResolvedValue(snapshot);
    const { result, unmount } = renderDelete();

    act(() => result.current.mutate('rule_1'));
    unmount();

    await waitFor(() => expect(mockShowSnackbar).toHaveBeenCalledTimes(1));
    expect(mutedRules()).toEqual(['rule_2']);
    await act(async () => mockShowSnackbar.mock.calls[0][0].undo());
    expect(mutedDuringRestore).toContain('rule_1');
    expect(mutedRules()).toEqual(['rule_2', 'rule_1']);
  });

  it('drops the re-mute again when the restore fails', async () => {
    mockRestore.mockRejectedValue(new Error('conflict'));
    mockDelete.mockResolvedValue(snapshot);
    const { result } = renderDelete();

    act(() => result.current.mutate('rule_1'));
    await waitFor(() => expect(mockShowSnackbar).toHaveBeenCalledTimes(1));
    await act(async () => mockShowSnackbar.mock.calls[0][0].undo());

    await waitFor(() => expect(mockShowSnackbar).toHaveBeenCalledTimes(2));
    expect(mutedRules()).toEqual(['rule_2']);
  });

  it('shows no snackbar for a rule that was already deleted', async () => {
    mockDelete.mockResolvedValue({ rule: null, runs: [] });
    const { result } = renderDelete();

    act(() => result.current.mutate('rule_1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockShowSnackbar).not.toHaveBeenCalled();
    expect(mutedRules()).toEqual(['rule_1', 'rule_2']);
  });
});
