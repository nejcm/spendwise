import { getSummaryByRange } from '@/features/insights/queries';

import { executeToolCall, getToolStatusMessage } from './tool-executor';

jest.mock('@/features/insights/queries', () => ({
  getCategorySpendByRange: jest.fn(),
  getSummaryByRange: jest.fn(),
  getTrendByRange: jest.fn(),
}));

jest.mock('@/features/transactions/queries', () => ({
  getTransactionsSample: jest.fn(),
}));

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
});
