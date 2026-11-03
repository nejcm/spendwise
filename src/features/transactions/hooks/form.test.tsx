import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { act, fireEvent, renderHook, render as renderWithProviders, screen, waitFor } from '@/lib/test-utils';
import { TransactionForm } from '../components/transaction-form';
import { useTransactionForm } from './form';

const mockLists = { pending: false };
const mockTagNames: string[] = [];
const mockCreate = jest.fn(async () => 'tx1');

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/features/currencies/hooks', () => ({ useCurrencyRates: () => ({ data: undefined }), useRatesForDate: () => ({ data: undefined }) }));
jest.mock('@/components/ui/snackbar', () => ({ showSnackbar: jest.fn() }));
jest.mock('@/features/accounts/api', () => ({
  useAccounts: () => ({ data: mockLists.pending ? undefined : [{ id: 'a1', name: 'Cash' }, { id: 'a2', name: 'Savings' }], isPending: mockLists.pending }),
}));
jest.mock('@/features/categories/api', () => ({
  useCategories: () => ({ data: mockLists.pending ? undefined : [], isPending: mockLists.pending }),
}));
jest.mock('@/features/transactions/api', () => ({
  useCreateTransaction: () => ({ mutateAsync: mockCreate, isPending: false }),
  useTagNames: () => ({ data: mockTagNames }),
  useUpdateTransaction: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutate: jest.fn() }),
}));

beforeEach(() => {
  mockLists.pending = false;
  mockTagNames.length = 0;
  mockCreate.mockClear();
});

describe('useTransactionForm', () => {
  it('keeps the next-entry values across rerenders after "add another"', async () => {
    const { result, rerender, unmount } = renderHook(() => useTransactionForm({ initialValues: { type: 'transfer', account_id: 'a1', amount: '5' } }));
    const { form } = result.current;
    act(() => {
      form.setFieldValue('amount', '12');
      form.setFieldValue('to_account_id', 'a2');
      form.setFieldValue('date', '2026-01-15');
    });

    await act(() => form.handleSubmit({ addAnother: true }));
    rerender({});

    expect(result.current.form.state.values).toMatchObject({ type: 'transfer', amount: '', to_account_id: 'a2', date: '2026-01-15' });
    unmount();
  });
});

describe('transactionForm', () => {
  it('waits for accounts and categories before building the form', () => {
    mockLists.pending = true;
    const { toJSON } = render(<TransactionForm onClose={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });
});

describe('transactionForm tags', () => {
  const transfer = { type: 'transfer', account_id: 'a1', to_account_id: 'a2', amount: '5' } as const;
  const longTag = 'x'.repeat(41);

  it('saves a typed tag that was never blurred', async () => {
    renderWithProviders(<TransactionForm initialValues={transfer} onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByLabelText('Add tag'), ' Lisbon ');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ tags: ['Lisbon'] })));
  });

  it('rejects an over-long suggestion with a visible error', async () => {
    mockTagNames.push(longTag);
    renderWithProviders(<TransactionForm initialValues={transfer} onClose={jest.fn()} />);
    fireEvent.press(screen.getByText(longTag));

    expect(screen.getByText('Max 40 characters')).toBeTruthy();
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ tags: [] })));
  });

  it('shows and announces the error for an over-long stored tag instead of failing silently', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    renderWithProviders(<TransactionForm initialValues={{ ...transfer, tags: [longTag] }} onClose={jest.fn()} />);
    fireEvent.press(screen.getByText('Save'));

    expect(await screen.findByText('Max 40 characters')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(screen.getByText(longTag)).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Max 40 characters');
  });
});
