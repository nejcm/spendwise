import { render } from '@testing-library/react-native';
import { act, renderHook } from '@/lib/test-utils';
import { TransactionForm } from '../components/transaction-form';
import { useTransactionForm } from './form';

const mockLists = { pending: false };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/ui/snackbar', () => ({ showSnackbar: jest.fn() }));
jest.mock('@/features/accounts/api', () => ({
  useAccounts: () => ({ data: mockLists.pending ? undefined : [{ id: 'a1', name: 'Cash' }, { id: 'a2', name: 'Savings' }], isPending: mockLists.pending }),
}));
jest.mock('@/features/categories/api', () => ({
  useCategories: () => ({ data: mockLists.pending ? undefined : [], isPending: mockLists.pending }),
}));
jest.mock('@/features/transactions/api', () => ({
  useCreateTransaction: () => ({ mutateAsync: jest.fn(async () => 'tx1'), isPending: false }),
  useUpdateTransaction: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutate: jest.fn() }),
}));

beforeEach(() => {
  mockLists.pending = false;
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
