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
    render(<BalanceCard total={500_000} accountCount={1} isEmpty={false} />);
    expect(screen.getByLabelText('Income')).toBeOnTheScreen();
    expect(screen.getByText(/2,?100/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Expenses')).toBeOnTheScreen();
    expect(screen.getByText(/1,?340/)).toBeOnTheScreen();
  });

  it('hides the row when there is no income or expense this month', () => {
    mockQueries(0);
    render(<BalanceCard total={500_000} accountCount={1} isEmpty={false} />);
    expect(screen.queryByLabelText('Income')).not.toBeOnTheScreen();
  });
});
