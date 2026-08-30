import type { AlertButton } from 'react-native';
import { act, renderHook } from '@/lib/test-utils';
import { useTransactionSelection } from './selection';

type SelectableTransaction = { id: string };

const mockMutate = jest.fn();
const mockDeleteSuccess: { current: (() => void) | undefined } = { current: undefined };
const mockAlert = jest.fn<(title: string, message: string, buttons: AlertButton[]) => void>();

jest.mock('./api', () => ({
  useDeleteTransactions: (onSuccess?: () => void) => {
    mockDeleteSuccess.current = onSuccess;
    return { mutate: mockMutate };
  },
}));

jest.mock('@/components/ui', () => ({
  Alert: { alert: (...args: [string, string, AlertButton[]]) => mockAlert(...args) },
}));

const transactions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

function confirmDelete() {
  const buttons = mockAlert.mock.calls.at(-1)?.[2];
  act(() => buttons?.find((button: AlertButton) => button.style === 'destructive')?.onPress?.());
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDeleteSuccess.current = undefined;
});

describe('useTransactionSelection', () => {
  it('starts in selection mode with the long-pressed transaction selected', () => {
    const { result } = renderHook(() => useTransactionSelection(transactions));

    expect(result.current.selectionMode).toBe(false);

    act(() => result.current.startSelection('b'));

    expect(result.current.selectionMode).toBe(true);
    expect([...result.current.selectedIds]).toEqual(['b']);
    expect(result.current.selectedCount).toBe(1);
  });

  it('toggles a transaction on and off', () => {
    const { result } = renderHook(() => useTransactionSelection(transactions));

    act(() => result.current.startSelection('a'));
    act(() => result.current.toggleSelection('c'));

    expect([...result.current.selectedIds]).toEqual(['a', 'c']);
    expect(result.current.selectedCount).toBe(2);

    act(() => result.current.toggleSelection('a'));

    expect([...result.current.selectedIds]).toEqual(['c']);
    expect(result.current.selectedCount).toBe(1);
  });

  it('ignores selected ids that are no longer in the list', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data: SelectableTransaction[] }) => useTransactionSelection(data),
      { initialProps: { data: transactions } },
    );

    act(() => result.current.startSelection('a'));
    act(() => result.current.toggleSelection('c'));

    rerender({ data: [{ id: 'c' }] });

    expect(result.current.selectedCount).toBe(1);

    result.current.deleteSelected();
    confirmDelete();

    expect(mockMutate).toHaveBeenCalledWith(['c']);
  });

  it('confirms before deleting and clears the selection on success', () => {
    const { result } = renderHook(() => useTransactionSelection(transactions));

    act(() => result.current.startSelection('a'));
    act(() => result.current.toggleSelection('b'));

    result.current.deleteSelected();

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockMutate).not.toHaveBeenCalled();

    confirmDelete();

    expect(mockMutate).toHaveBeenCalledWith(['a', 'b']);

    act(() => mockDeleteSuccess.current?.());

    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('does not prompt when nothing is selected', () => {
    const { result } = renderHook(() => useTransactionSelection(transactions));

    act(() => result.current.startSelection('a'));
    act(() => result.current.toggleSelection('a'));

    result.current.deleteSelected();

    expect(mockAlert).not.toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('clears the selection and exits selection mode', () => {
    const { result } = renderHook(() => useTransactionSelection(transactions));

    act(() => result.current.startSelection('a'));
    act(() => result.current.clearSelection());

    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });
});
