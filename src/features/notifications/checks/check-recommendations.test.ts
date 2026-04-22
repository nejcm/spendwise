import { storage } from '@/lib/storage';
import { checkRecommendations } from './check-recommendations';

const mockStorageState = new Map<string, string>();

jest.mock('@/features/recommendations/queries', () => ({
  getRecommendations: jest.fn(),
}));

jest.mock('../send', () => ({
  send: jest.fn(),
}));

jest.mock('@/lib/storage', () => ({
  storage: {
    clearAll: () => mockStorageState.clear(),
    getString: (key: string) => mockStorageState.get(key),
    set: (key: string, value: string) => mockStorageState.set(key, value),
  },
}));

const { getRecommendations } = jest.requireMock('@/features/recommendations/queries') as {
  getRecommendations: jest.Mock;
};
const { send } = jest.requireMock('../send') as { send: jest.Mock };

describe('checkRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.clearAll();
  });

  it('sends a notification once for high-priority recommendations', async () => {
    getRecommendations.mockResolvedValue([
      {
        id: 'upcoming_cashflow:acc_1:2025-04-15',
        kind: 'upcoming_cashflow',
        severity: 'high',
        primaryTarget: 'accounts',
        question: 'test',
        accountName: 'Main',
        amountCents: 12000,
        comparisonAmountCents: 10000,
        currency: 'USD',
        count: 2,
        days: 7,
      },
    ]);

    await checkRecommendations({} as never, { recommendations: true });
    await checkRecommendations({} as never, { recommendations: true });

    expect(send).toHaveBeenCalledTimes(1);
  });
});
