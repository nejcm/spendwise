import { useBalanceSeries } from '@/features/accounts/api';
import { useMonthSummary } from '@/features/transactions/api';
import { render, screen } from '@/lib/test-utils';
import { BalanceCard } from './balance-card';

jest.mock('expo-router', () => ({ useNavigation: () => ({ addListener: () => jest.fn() }) }));
jest.mock('@/features/accounts/api', () => ({ useBalanceSeries: jest.fn() }));
jest.mock('@/features/transactions/api', () => ({ useMonthSummary: jest.fn() }));
jest.mock('./balance-line', () => ({ BalanceLine: () => null }));

function mockQueries(income: number, expense = 0) {
  jest.mocked(useBalanceSeries).mockReturnValue({ data: { opening: 0, deltas: [] } } as any);
  jest.mocked(useMonthSummary).mockReturnValue({ data: { income, expense, balance: income - expense } } as any);
}

describe('balance card income row', () => {
  it('shows this month\'s income and expenses', () => {
    mockQueries(210_000, 134_020);
    render(<BalanceCard isEmpty={false} />);
    expect(screen.getByLabelText('Income')).toBeOnTheScreen();
    expect(screen.getByText(/2,?100/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Expenses')).toBeOnTheScreen();
    expect(screen.getByText(/1,?340/)).toBeOnTheScreen();
  });

  it('hides the row when there is no income or expense this month', () => {
    mockQueries(0);
    render(<BalanceCard isEmpty={false} />);
    expect(screen.queryByLabelText('Income')).not.toBeOnTheScreen();
  });
});

describe('balance card headline', () => {
  it('shows this month\'s net change, not the balance carried in', () => {
    jest.mocked(useBalanceSeries).mockReturnValue({ data: { opening: 4_170_000, deltas: [{ date: 1, delta: 150_000 }, { date: 2, delta: -30_000 }] } } as any);
    jest.mocked(useMonthSummary).mockReturnValue({ data: { income: 0, expense: 0, balance: 0 } } as any);
    render(<BalanceCard isEmpty={false} />);
    expect(screen.getByText('Net this month')).toBeOnTheScreen();
    expect(screen.getByText(/^\+.*1,?200/)).toBeOnTheScreen();
    expect(screen.queryByText(/42,?900/)).not.toBeOnTheScreen();
  });
});
