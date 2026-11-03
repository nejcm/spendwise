import type { DeletedTransaction } from '../queries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { act, renderHook, waitFor } from '@/lib/test-utils';
import { useDeleteTransactionWithUndo } from './api';

const mockDelete = jest.fn<(db: unknown, arg: string) => Promise<DeletedTransaction>>();
const mockRestore = jest.fn<(db: unknown, arg: DeletedTransaction) => Promise<void>>();
const mockShowSnackbar = jest.fn();

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('../queries', () => ({
  deleteTransaction: (...args: [unknown, string]) => mockDelete(...args),
  restoreTransaction: (...args: [unknown, DeletedTransaction]) => mockRestore(...args),
}));
jest.mock('@/components/ui/snackbar', () => ({ showSnackbar: (options: unknown) => mockShowSnackbar(options) }));
jest.mock('@/components/ui', () => ({ Alert: { alert: jest.fn() } }));

const snapshot = { transactions: [{ id: 'tx_1' }], runs: [] } as unknown as DeletedTransaction;

function renderDelete() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useDeleteTransactionWithUndo(), { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRestore.mockResolvedValue(undefined);
});

describe('useDeleteTransactionWithUndo', () => {
  it('shows the Undo snackbar and restores even after the screen unmounts', async () => {
    let resolve!: (value: DeletedTransaction) => void;
    mockDelete.mockReturnValue(new Promise((r) => {
      resolve = r;
    }));
    const { result, unmount } = renderDelete();

    act(() => result.current.mutate('tx_1'));
    unmount();
    await act(async () => resolve(snapshot));

    await waitFor(() => expect(mockShowSnackbar).toHaveBeenCalledTimes(1));
    await act(async () => mockShowSnackbar.mock.calls[0][0].undo());
    expect(mockRestore).toHaveBeenCalledWith(expect.anything(), snapshot);
  });

  it('keeps the first snapshot when a second delete finds nothing left', async () => {
    mockDelete.mockResolvedValueOnce(snapshot).mockResolvedValueOnce({ transactions: [], runs: [], tags: [] });
    const { result } = renderDelete();

    act(() => {
      result.current.mutate('tx_1');
      result.current.mutate('tx_1');
    });

    await waitFor(() => expect(mockDelete).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSnackbar).toHaveBeenCalledTimes(1);
    await act(async () => mockShowSnackbar.mock.calls[0][0].undo());
    expect(mockRestore).toHaveBeenCalledWith(expect.anything(), snapshot);
  });
});
