import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';
import { useAccountsWithBalance } from '@/features/accounts/api';
import { useHasUserTransactions, useRecentTransactions } from '@/features/transactions/api';
import { render, screen } from '@/lib/test-utils';
import { HomeScreen } from './home-screen';

function mockStub(testID: string) {
  const React = jest.requireActual<typeof ReactModule>('react');
  const { View } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return () => React.createElement(View, { testID });
}

jest.mock('@/features/accounts/api', () => ({ useAccountsWithBalance: jest.fn() }));
jest.mock('@/features/transactions/api', () => ({ useHasUserTransactions: jest.fn(), useRecentTransactions: jest.fn() }));
jest.mock('@/features/scheduled-transactions/hooks', () => ({ useScheduledTransactions: () => ({ data: [] }) }));
jest.mock('@/lib/hooks/use-refresh', () => ({ useRefresh: () => ({ refreshing: false, onRefresh: jest.fn() }) }));
jest.mock('./category-spending-chart-card', () => ({ CategorySpendingChartCard: mockStub('chart') }));
jest.mock('./components/accounts-carousel', () => ({ AccountsCarousel: mockStub('carousel') }));
jest.mock('./components/balance-card', () => ({ BalanceCard: mockStub('balance') }));
jest.mock('./components/home-header', () => ({ HomeHeader: mockStub('header') }));
jest.mock('./components/insight-card', () => ({ InsightCard: mockStub('insight') }));
jest.mock('./components/month-budget-card', () => ({ MonthBudgetCard: mockStub('budget') }));
jest.mock('./components/next-bill-row', () => ({ NextBillRow: mockStub('next-bill') }));
jest.mock('./components/quick-actions', () => ({ QuickActions: mockStub('quick-actions') }));
jest.mock('./components/recent-activity', () => ({ RecentActivity: mockStub('recent') }));
jest.mock('./components/setup-checklist', () => ({ SetupChecklist: mockStub('setup') }));

const adjustment = { id: 'adj', is_adjustment: 1 };

function mockQueries({ hasUserTransactions, existsPending = false }: { hasUserTransactions?: boolean; existsPending?: boolean }) {
  jest.mocked(useAccountsWithBalance).mockReturnValue({ data: [], isPending: false } as any);
  jest.mocked(useRecentTransactions).mockReturnValue({ data: Array.from({ length: 5 }).fill(adjustment), isPending: false } as any);
  jest.mocked(useHasUserTransactions).mockReturnValue({ data: hasUserTransactions, isPending: existsPending } as any);
}

describe('home screen empty state', () => {
  it('shows Home when the user has transactions even if the recent rows are all adjustments', () => {
    mockQueries({ hasUserTransactions: true });
    render(<HomeScreen />);
    expect(screen.getByTestId('quick-actions')).toBeOnTheScreen();
    expect(screen.queryByTestId('setup')).not.toBeOnTheScreen();
  });

  it('shows the setup checklist when there are no user transactions', () => {
    mockQueries({ hasUserTransactions: false });
    render(<HomeScreen />);
    expect(screen.getByTestId('setup')).toBeOnTheScreen();
    expect(screen.queryByTestId('quick-actions')).not.toBeOnTheScreen();
  });

  it('renders neither while the existence query is pending', () => {
    mockQueries({ existsPending: true });
    render(<HomeScreen />);
    expect(screen.queryByTestId('setup')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('quick-actions')).not.toBeOnTheScreen();
  });

  it('does not show the setup checklist when the existence query errored without data', () => {
    mockQueries({});
    render(<HomeScreen />);
    expect(screen.queryByTestId('setup')).not.toBeOnTheScreen();
  });
});
