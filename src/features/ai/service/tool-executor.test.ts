import type { CategorySpend } from '@/features/insights/types';
import { getCategorySpendByRange, getSummaryByRange } from '@/features/insights/queries';

import { executeToolCall, getToolStatusMessage } from './tool-executor';

jest.mock('@/features/insights/queries', () => ({
  getCategorySpendByRange: jest.fn(),
  getSummaryByRange: jest.fn(),
  getTrendByRange: jest.fn(),
}));

jest.mock('@/features/transactions/queries', () => ({
  getTransactionsSample: jest.fn(),
}));

const getCategorySpendByRangeMock = getCategorySpendByRange as jest.MockedFunction<typeof getCategorySpendByRange>;
const getSummaryByRangeMock = getSummaryByRange as jest.MockedFunction<typeof getSummaryByRange>;

describe('ai tool executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns translated tool status messages with date ranges', () => {
    expect(getToolStatusMessage('get_summary', {
      start_date: '2026-01-01',
      end_date: '2026-02-01',
    })).toBe('Looking up your financial summary (2026-01-01 to 2026-02-01)...');
  });

  it('wraps tool execution failures as JSON errors', async () => {
    getSummaryByRangeMock.mockRejectedValueOnce(new Error('Invalid date range'));

    await expect(executeToolCall({} as never, 'get_summary', {
      start_date: '2026-01-01',
      end_date: '2026-02-01',
    })).resolves.toBe(JSON.stringify({ error: 'Invalid date range' }));
  });

  it('reports category expense and income totals separately', async () => {
    const row = (category_name: string, expense_total: number, income_total: number): CategorySpend => ({
      category_id: category_name,
      category_name,
      category_color: '',
      category_icon: '',
      category_budget: null,
      category_type: 'expense',
      sort_order: 0,
      total: expense_total + income_total,
      income_total,
      expense_total,
      percentage: 0,
    });
    getCategorySpendByRangeMock.mockResolvedValueOnce([row('Food', 3000, 1000), row('Idle', 0, 0), row('Refunds', 0, 500)]);

    const result = JSON.parse(await executeToolCall({} as never, 'get_category_spending', {
      start_date: '2026-01-01',
      end_date: '2026-02-01',
    }));

    expect(result.categories).toEqual([
      { name: 'Food', kind: 'expense', expense_total: 30, income_total: 10, budget: null },
      { name: 'Refunds', kind: 'expense', expense_total: 0, income_total: 5, budget: null },
    ]);
  });

  it('passes the scoped account ids to the query', async () => {
    getSummaryByRangeMock.mockResolvedValueOnce({ income: 0, expense: 0, balance: 0 });
    const db = {} as never;

    await executeToolCall(db, 'get_summary', { start_date: '2026-01-01', end_date: '2026-02-01' }, ['acc_1']);

    expect(getSummaryByRangeMock).toHaveBeenCalledWith(db, expect.any(Number), expect.any(Number), ['acc_1']);
  });
});
