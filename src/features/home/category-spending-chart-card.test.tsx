import type { CategorySpend } from '@/features/insights/types';
import { useCategorySpendByRange } from '@/features/insights/api';
import { fireEvent, render, screen } from '@/lib/test-utils';
import { getCategorySpendingChartData } from './category-spending-chart';
import { CategorySpendingChartCard } from './category-spending-chart-card';

const mockPieChart = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('react-native-gifted-charts', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    PieChart: (props: unknown) => {
      mockPieChart(props);
      return React.createElement(View, { testID: 'category-spending-donut' });
    },
  };
});

jest.mock('@/components/ui/skeleton', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return { Skeleton: () => React.createElement(View) };
});

jest.mock('@/features/insights/api', () => ({
  useCategorySpendByRange: jest.fn(),
}));

jest.mock('uniwind', () => ({
  ...jest.requireActual('uniwind'),
  useCSSVariable: () => '#efefef',
}));

const useCategorySpendByRangeMock = useCategorySpendByRange as jest.MockedFunction<typeof useCategorySpendByRange>;

function category(overrides: Partial<CategorySpend> = {}): CategorySpend {
  return {
    category_id: 'category-1',
    category_name: 'Groceries',
    category_color: '#ef4444',
    category_icon: '🛒',
    category_budget: null,
    category_type: 'expense',
    sort_order: 0,
    total: 12_000,
    income_total: 0,
    expense_total: 12_000,
    percentage: 100,
    ...overrides,
  };
}

function mockCategories(data: CategorySpend[] | undefined, isLoading = false) {
  useCategorySpendByRangeMock.mockReturnValue({ data, isLoading } as ReturnType<typeof useCategorySpendByRange>);
}

describe('category spending chart card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategories([
      category(),
      category({
        category_id: 'category-2',
        category_name: 'Transport',
        category_color: '#3b82f6',
        expense_total: 8_000,
        total: 8_000,
      }),
    ]);
  });

  it('renders current-month expense totals as a donut', () => {
    render(<CategorySpendingChartCard />);

    expect(screen.getByTestId('category-spending-donut')).toBeOnTheScreen();
    expect(screen.getByText('Groceries')).toBeOnTheScreen();
    expect(screen.getByText('Transport')).toBeOnTheScreen();
    expect(mockPieChart).toHaveBeenCalledWith(expect.objectContaining({
      donut: true,
      data: [
        expect.objectContaining({ label: 'Groceries', value: 12_000, color: '#ef4444' }),
        expect.objectContaining({ label: 'Transport', value: 8_000, color: '#3b82f6' }),
      ],
    }));
  });

  it('groups smaller categories into other', () => {
    const data = Array.from({ length: 6 }, (_, index) => category({
      category_id: `category-${index}`,
      category_name: `Category ${index}`,
      expense_total: (6 - index) * 1_000,
    }));

    expect(getCategorySpendingChartData(data)).toEqual([
      expect.objectContaining({ label: 'Category 0', value: 6_000 }),
      expect.objectContaining({ label: 'Category 1', value: 5_000 }),
      expect.objectContaining({ label: 'Category 2', value: 4_000 }),
      expect.objectContaining({ label: 'Category 3', value: 3_000 }),
      expect.objectContaining({ label: 'Other', value: 3_000 }),
    ]);
  });

  it('renders loading and empty states', () => {
    mockCategories(undefined, true);
    const { rerender } = render(<CategorySpendingChartCard />);
    expect(screen.getByTestId('category-spending-chart-loading')).toBeOnTheScreen();

    mockCategories([]);
    rerender(<CategorySpendingChartCard />);
    expect(screen.getByText('No category spending this month.')).toBeOnTheScreen();
  });

  it('opens stats when pressed', () => {
    render(<CategorySpendingChartCard />);

    fireEvent.press(screen.getByText('Category spending'));

    expect(mockRouterPush).toHaveBeenCalledWith('/stats');
  });
});
