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
      const data = (props as { data?: { topLabelComponent?: () => React.ReactNode }[] }).data ?? [];
      return React.createElement(
        View,
        { testID: 'monthly-expense-trend-chart' },
        data.map((item, index) => React.createElement(React.Fragment, { key: index }, item.topLabelComponent?.())),
      );
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

jest.mock('uniwind', () => ({
  ...jest.requireActual('uniwind'),
  // eslint-disable-next-line react/no-unnecessary-use-prefix
  useCSSVariable: () => '#336B87',
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

  it('renders monthly expense bars centered in their columns using the selected accent color', () => {
    render(<MonthlyExpenseTrendCard />);
    fireEvent(
      screen.getByTestId('monthly-expense-trend-chart-container'),
      'layout',
      { nativeEvent: { layout: { width: 300, height: 96, x: 0, y: 0 } } },
    );

    expect(useMonthlyTrendMock).toHaveBeenCalledWith(6);
    expect(screen.queryByText('25% lower than last month')).not.toBeOnTheScreen();
    expect(screen.getByTestId('monthly-expense-value-2026-07')).toHaveTextContent('750$');
    expect(screen.getByTestId('monthly-expense-trend-chart')).toBeOnTheScreen();
    expect(mockBarChart).toHaveBeenCalledWith(expect.objectContaining({
      barWidth: 27,
      disableScroll: true,
      height: 90,
      maxValue: 1100 / 0.85,
      width: 300,
      spacing: 138 / 7,
      data: [
        expect.objectContaining({
          label: 'Feb',
          value: 800,
          frontColor: '#336B87',
          labelTextStyle: expect.objectContaining({ textAlign: 'center' }),
          topLabelComponent: expect.any(Function),
          topLabelContainerStyle: {
            left: -69 / 7,
            paddingBottom: 2,
            width: 27 + 138 / 7,
          },
        }),
        expect.objectContaining({ label: 'Mar', value: 900, frontColor: '#336B87' }),
        expect.objectContaining({ label: 'Apr', value: 700, frontColor: '#336B87' }),
        expect.objectContaining({ label: 'May', value: 1100, frontColor: '#336B87' }),
        expect.objectContaining({ label: 'Jun', value: 1000, frontColor: '#336B87' }),
        expect.objectContaining({ label: 'Jul', value: 750, frontColor: '#336B87' }),
      ],
      initialSpacing: 69 / 7,
      endSpacing: 0,
    }));
  });

  it('keeps chart geometry centered without negative spacing at narrow widths', () => {
    expect(getMonthlyTrendChartGeometry(12, 6)).toEqual({
      chartWidth: 12,
      barWidth: 1,
      spacing: 6 / 7,
      initialSpacing: 3 / 7,
      endSpacing: 0,
    });
    expect(getMonthlyTrendChartGeometry(3, 6)).toEqual({
      chartWidth: 3,
      barWidth: 0.5,
      spacing: 0,
      initialSpacing: 0,
      endSpacing: 0,
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
