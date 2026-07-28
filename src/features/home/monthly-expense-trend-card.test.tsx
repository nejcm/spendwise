import { useMonthlyTrend } from '@/features/insights/api';
import { fireEvent, render, screen } from '@/lib/test-utils';
import { getMonthlyTrendChartGeometry } from './monthly-expense-trend';
import { MonthlyExpenseTrendCard } from './monthly-expense-trend-card';

const mockBarChart = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  // eslint-disable-next-line react/no-unnecessary-use-prefix
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('react-native-gifted-charts', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    BarChart: (props: unknown) => {
      mockBarChart(props);
      return React.createElement(View, { testID: 'monthly-expense-trend-chart' });
    },
  };
});

jest.mock('@/components/ui/skeleton', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return { Skeleton: () => React.createElement(View) };
});

jest.mock('@/features/insights/api', () => ({
  useMonthlyTrend: jest.fn(),
}));

const useMonthlyTrendMock = useMonthlyTrend as jest.MockedFunction<typeof useMonthlyTrend>;

function mockTrend(data: ReturnType<typeof useMonthlyTrend>['data'], isLoading = false) {
  useMonthlyTrendMock.mockReturnValue({ data, isLoading } as ReturnType<typeof useMonthlyTrend>);
}

describe('monthly expense trend card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrend([
      { month: '2026-02', income: 0, expense: 80_000 },
      { month: '2026-03', income: 0, expense: 90_000 },
      { month: '2026-04', income: 0, expense: 70_000 },
      { month: '2026-05', income: 0, expense: 110_000 },
      { month: '2026-06', income: 0, expense: 100_000 },
      { month: '2026-07', income: 0, expense: 75_000 },
    ]);
  });

  it('renders monthly expense bars centered in their columns and highlights the current month', () => {
    render(<MonthlyExpenseTrendCard />);
    fireEvent(
      screen.getByTestId('monthly-expense-trend-chart-container'),
      'layout',
      { nativeEvent: { layout: { width: 300, height: 96, x: 0, y: 0 } } },
    );

    expect(useMonthlyTrendMock).toHaveBeenCalledWith(6);
    expect(screen.queryByText('25% lower than last month')).not.toBeOnTheScreen();
    expect(screen.queryByText('750$')).not.toBeOnTheScreen();
    expect(screen.getByTestId('monthly-expense-trend-chart')).toBeOnTheScreen();
    expect(mockBarChart).toHaveBeenCalledWith(expect.objectContaining({
      barWidth: 27,
      disableScroll: true,
      height: 96,
      width: 300,
      spacing: 138 / 7,
      data: [
        expect.objectContaining({
          label: 'Feb',
          value: 800,
          labelTextStyle: expect.objectContaining({ textAlign: 'center' }),
        }),
        expect.objectContaining({ label: 'Mar', value: 900 }),
        expect.objectContaining({ label: 'Apr', value: 700 }),
        expect.objectContaining({ label: 'May', value: 1100 }),
        expect.objectContaining({ label: 'Jun', value: 1000 }),
        expect.objectContaining({ label: 'Jul', value: 750, frontColor: 'rgba(248, 60, 78, 0.88)' }),
      ],
      initialSpacing: 69 / 7,
      endSpacing: 69 / 7,
    }));
  });

  it('keeps chart geometry centered without negative spacing at narrow widths', () => {
    expect(getMonthlyTrendChartGeometry(12, 6)).toEqual({
      chartWidth: 12,
      barWidth: 1,
      spacing: 6 / 7,
      edgeSpacing: 3 / 7,
    });
    expect(getMonthlyTrendChartGeometry(3, 6)).toEqual({
      chartWidth: 3,
      barWidth: 0.5,
      spacing: 0,
      edgeSpacing: 0,
    });
  });

  it('renders loading and empty states', () => {
    mockTrend(undefined, true);
    const { rerender } = render(<MonthlyExpenseTrendCard />);
    expect(screen.getByTestId('monthly-expense-trend-loading')).toBeOnTheScreen();

    mockTrend([
      { month: '2026-06', income: 0, expense: 0 },
      { month: '2026-07', income: 0, expense: 0 },
    ]);
    rerender(<MonthlyExpenseTrendCard />);
    expect(screen.getByText('No expenses in the last six months.')).toBeOnTheScreen();
  });

  it('opens stats when pressed', () => {
    render(<MonthlyExpenseTrendCard />);

    fireEvent.press(screen.getByText('Expense trend'));

    expect(mockRouterPush).toHaveBeenCalledWith('/stats');
  });
});
