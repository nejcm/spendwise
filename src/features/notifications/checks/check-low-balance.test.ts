import { checkLowBalance } from './check-low-balance';

const mockStorageState = new Map<string, string>();

jest.mock('@/features/notifications/queries', () => ({ getAccountBalances: jest.fn() }));
jest.mock('../send', () => ({ send: jest.fn() }));
jest.mock('@/lib/storage', () => ({
  storage: {
    getString: (key: string) => mockStorageState.get(key),
    set: (key: string, value: string) => mockStorageState.set(key, value),
  },
}));

const { getAccountBalances } = jest.requireMock('@/features/notifications/queries') as { getAccountBalances: jest.Mock };
const { send } = jest.requireMock('../send') as { send: jest.Mock };
const MOCK_DB = {} as any;

describe('checkLowBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageState.clear();
    getAccountBalances.mockResolvedValue([
      { id: 'acc_low', name: 'Checking', baseBalance: 4_999 },
      { id: 'acc_at', name: 'Savings', baseBalance: 5_000 },
    ]);
  });

  it('alerts once a day for each account strictly below the threshold', async () => {
    await checkLowBalance(MOCK_DB, { lowBalance: true, lowBalanceThresholdCents: 5_000 });
    await checkLowBalance(MOCK_DB, { lowBalance: true, lowBalanceThresholdCents: 5_000 });

    expect(send.mock.calls).toEqual([[expect.any(String), 'Checking balance is below the alert threshold.']]);
  });

  it('is off unless explicitly enabled', async () => {
    await checkLowBalance(MOCK_DB, {});

    expect(send).not.toHaveBeenCalled();
  });
});
