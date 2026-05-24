import type { CategorySpend } from '@/features/insights/types';
import { useCategorySpendByRange } from '@/features/insights/api';
import { render, screen, setup } from '@/lib/test-utils';

import { CategoryBreakdown } from './category-breakdown';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  // eslint-disable-next-line react/no-unnecessary-use-prefix
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('@/features/insights/api', () => ({
  useCategorySpendByRange: jest.fn(),
}));

jest.mock('@/components/ui/icon', () => ({
  ChevronRight: () => null,
}));

const useCategorySpendByRangeMock = useCategorySpendByRange as jest.MockedFunction<typeof useCategorySpendByRange>;

const categories: CategorySpend[] = [
  {
    category_id: 'rent',
    category_name: 'Rent and utilities',
    category_color: '#0f7a36',
    category_icon: 'R',
    category_budget: null,
    category_type: 'expense',
    sort_order: 1,
    total: 534200,
    income_total: 0,
    expense_total: 534200,
    percentage: 0,
  },
  {
    category_id: 'groceries',
    category_name: 'Groceries',
    category_color: '#2ebe7e',
    category_icon: 'G',
    category_budget: null,
    category_type: 'expense',
    sort_order: 2,
    total: 13500,
    income_total: 0,
    expense_total: 13500,
    percentage: 0,
  },
];

function mockCategorySpend(data: CategorySpend[]) {
  useCategorySpendByRangeMock.mockReturnValue({
    data,
    isLoading: false,
  } as unknown as ReturnType<typeof useCategorySpendByRange>);
}

describe('category breakdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategorySpend(categories);
  });

  it('renders the horizontal breakdown in chart mode', async () => {
    const { user } = setup(
      <CategoryBreakdown
        startDate={1}
        endDate={2}
        currency="USD"
        type="expense"
      />,
    );

    await user.press(screen.getByText('Chart'));

    expect(screen.getByTestId('category-horizontal-breakdown')).toBeOnTheScreen();
    expect(screen.getByText('Rent and utilities')).toBeOnTheScreen();
    expect(screen.getByText('Groceries')).toBeOnTheScreen();
    expect(screen.getByText('5342$')).toBeOnTheScreen();
  });

  it('opens transactions for chart category rows', async () => {
    const { user } = setup(
      <CategoryBreakdown
        startDate={1}
        endDate={2}
        currency="USD"
        type="expense"
      />,
    );

    await user.press(screen.getByText('Chart'));
    await user.press(screen.getByText('Groceries'));

    expect(mockRouterPush).toHaveBeenCalledWith('/transactions?categoryId=groceries');
  });

  it('renders the empty state when no categories match', () => {
    mockCategorySpend([]);

    render(
      <CategoryBreakdown
        startDate={1}
        endDate={2}
        currency="USD"
        type="expense"
      />,
    );

    expect(screen.getByText('No data for this period')).toBeOnTheScreen();
  });
});
