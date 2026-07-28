import { clearAppStore, updateAppState } from '@/lib/store/store';
import { render, screen } from '@/lib/test-utils';
import { HomeScreenChart } from './home-screen-chart';

jest.mock('./category-spending-chart-card', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return { CategorySpendingChartCard: () => React.createElement(View, { testID: 'category-spending-chart' }) };
});

jest.mock('./monthly-expense-trend-card', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return { MonthlyExpenseTrendCard: () => React.createElement(View, { testID: 'monthly-spending-chart' }) };
});

describe('home screen chart', () => {
  beforeEach(() => {
    clearAppStore();
  });

  it('shows monthly spending by default', () => {
    render(<HomeScreenChart />);

    expect(screen.getByTestId('monthly-spending-chart')).toBeOnTheScreen();
    expect(screen.queryByTestId('category-spending-chart')).not.toBeOnTheScreen();
  });

  it('shows category spending when selected', () => {
    updateAppState({ homeScreenChart: 'category_spending' });

    render(<HomeScreenChart />);

    expect(screen.getByTestId('category-spending-chart')).toBeOnTheScreen();
    expect(screen.queryByTestId('monthly-spending-chart')).not.toBeOnTheScreen();
  });

  it('hides charts when none is selected', () => {
    updateAppState({ homeScreenChart: 'none' });

    render(<HomeScreenChart />);

    expect(screen.queryByTestId('category-spending-chart')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('monthly-spending-chart')).not.toBeOnTheScreen();
  });
});
