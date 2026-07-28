import { useTrendByRange } from '@/features/insights/api';
import { useGlobalBudget } from '@/features/stats/hooks';
import { render, screen } from '@/lib/test-utils';
import { SpendingPaceCard } from './spending-pace-card';

const mockLineChart = jest.fn();

jest.mock('react-native-gifted-charts', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    LineChart: (props: unknown) => {
      mockLineChart(props);
      return React.createElement(View, { testID: 'spending-pace-chart' });
    },
  };
});

jest.mock('@/components/ui/skeleton', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    Skeleton: () => React.createElement(View),
  };
});

jest.mock('@/features/insights/api', () => ({
  useTrendByRange: jest.fn(),
}));

jest.mock('@/features/stats/hooks', () => ({
  useGlobalBudget: jest.fn(),
}));

const useTrendByRangeMock = useTrendByRange as jest.MockedFunction<typeof useTrendByRange>;
const useGlobalBudgetMock = useGlobalBudget as jest.MockedFunction<typeof useGlobalBudget>;

function mockBudget(data: ReturnType<typeof useGlobalBudget>['data'], isLoading = false) {
  useGlobalBudgetMock.mockReturnValue({
    data,
    isLoading,
  } as ReturnType<typeof useGlobalBudget>);
}

function mockTrend(data: ReturnType<typeof useTrendByRange>['data'], isLoading = false) {
  useTrendByRangeMock.mockReturnValue({
    data,
    isLoading,
  } as ReturnType<typeof useTrendByRange>);
}

describe('spending pace card', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 10));
    jest.clearAllMocks();
    mockBudget({ amountCents: 310_000, type: 'monthly' });
    mockTrend([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders its loading state', () => {
    mockBudget(undefined, true);

    render(<SpendingPaceCard />);

    expect(screen.getByTestId('spending-pace-loading')).toBeOnTheScreen();
  });

  it('prompts for a budget when none is configured', () => {
    mockBudget(null);

    render(<SpendingPaceCard />);

    expect(screen.getByText('Set a budget above to compare your spending pace.')).toBeOnTheScreen();
    expect(screen.queryByTestId('spending-pace-chart')).not.toBeOnTheScreen();
  });

  it('hides the chart when there are no expenses', () => {
    render(<SpendingPaceCard />);

    expect(screen.getByText('No expenses this month yet.')).toBeOnTheScreen();
    expect(screen.queryByTestId('spending-pace-chart')).not.toBeOnTheScreen();
  });

  it('renders an over-pace chart for front-loaded spending', () => {
    mockTrend([{
      date: Date.UTC(2026, 6, 1) / 1000,
      income: 0,
      expense: 150_000,
    }]);

    render(<SpendingPaceCard />);

    expect(screen.getByText('over pace')).toBeOnTheScreen();
    expect(screen.getByTestId('spending-pace-chart')).toBeOnTheScreen();
    expect(mockLineChart).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([expect.objectContaining({ label: '31', value: 3100 })]),
      data2: expect.arrayContaining([expect.objectContaining({ value: 1500 })]),
      strokeDashArray1: [5, 5],
    }));
  });

  it('renders the amount below pace', () => {
    mockTrend([{
      date: Date.UTC(2026, 6, 3) / 1000,
      income: 0,
      expense: 40_000,
    }]);

    render(<SpendingPaceCard />);

    expect(screen.getByText('600$')).toBeOnTheScreen();
    expect(screen.getByText('below pace')).toBeOnTheScreen();
  });

  it('renders on pace without a zero variance amount', () => {
    mockTrend([{
      date: Date.UTC(2026, 6, 3) / 1000,
      income: 0,
      expense: 100_000,
    }]);

    render(<SpendingPaceCard />);

    expect(screen.getByText('On pace')).toBeOnTheScreen();
    expect(screen.queryByText('0$')).not.toBeOnTheScreen();
  });
});
