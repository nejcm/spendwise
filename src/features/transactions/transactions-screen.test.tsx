import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';
import type { TransactionRouteParams } from './route-params';
import { useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/lib/store/store';
import { fireEvent, render, screen } from '@/lib/test-utils';
import { TransactionsScreen } from './transactions-screen';

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('@/components/period-pill', () => ({ PeriodPill: () => null }));
jest.mock('@/components/ui/focus-aware-status-bar', () => ({ FocusAwareStatusBar: () => null }));
jest.mock('@/features/accounts/hooks', () => ({ useAccounts: () => ({ data: [] }) }));
jest.mock('@/features/categories/api', () => ({ useCategories: () => ({ data: [] }) }));
jest.mock('@/lib/data/prefetch', () => ({ usePrefetchAdjacentPeriods: jest.fn() }));
jest.mock('./api', () => ({
  transactionsQueryOptions: jest.fn(),
  useHasUserTransactions: () => ({ data: true }),
  useTransactions: () => ({ data: [], isLoading: false, refetch: jest.fn() }),
}));
jest.mock('./hooks/selection', () => ({
  useTransactionSelection: () => ({ selectionMode: false, selectedIds: new Set(), selectedCount: 0 }),
}));
jest.mock('./components/transaction-filter-sheet', () => ({ TransactionFilterSheet: () => null }));
jest.mock('./components/transaction-list', () => ({
  TransactionList: ({ header }: { header: React.ReactElement }) => header,
}));
jest.mock('./components/activity-controls', () => {
  const React = jest.requireActual<typeof ReactModule>('react');
  const { Text, TextInput, View } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return {
    SearchRow: ({ search, onChangeSearch, filterCount }: { search: string; onChangeSearch: (v: string) => void; filterCount: number }) =>
      React.createElement(View, null, React.createElement(TextInput, { testID: 'search', value: search, onChangeText: onChangeSearch }), React.createElement(Text, { testID: 'filter-count' }, String(filterCount))),
    ActiveFilters: () => null,
    FilterResultCard: () => null,
    InOutNetCard: () => null,
    TypeTabs: () => null,
  };
});

function setParams(params: TransactionRouteParams) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
}

describe('transactions screen route seed', () => {
  it('re-applies new route params on a mounted screen and keeps user edits while they are unchanged', () => {
    setParams({ categoryId: 'cat_1' });
    const { rerender } = render(<TransactionsScreen />);
    expect(screen.getByTestId('filter-count')).toHaveTextContent('1');

    fireEvent.changeText(screen.getByTestId('search'), 'coffee');
    setParams({ categoryId: 'cat_1' });
    rerender(<TransactionsScreen />);
    expect(screen.getByTestId('search')).toHaveProp('value', 'coffee');

    setParams({ accountId: 'acc_1,acc_2', categoryId: 'cat_2', period: 'month:2025-03' });
    rerender(<TransactionsScreen />);
    expect(screen.getByTestId('search')).toHaveProp('value', '');
    expect(screen.getByTestId('filter-count')).toHaveTextContent('3');
    expect(useAppStore.getState().periodSelection).toEqual({ mode: 'month', year: 2025, month: 3 });
  });
});
