import { checkBudgetAlerts } from './check-budget-alerts';

const mockStorageState = new Map<string, string>();

jest.mock('@/features/notifications/queries', () => ({
  getBudgetSpendForMonth: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/features/stats/global-budget-queries', () => ({
  getGlobalBudget: jest.fn(),
  getGlobalBudgetSpend: jest.fn(),
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

const { getGlobalBudget, getGlobalBudgetSpend } = jest.requireMock(
  '@/features/stats/global-budget-queries',
) as { getGlobalBudget: jest.Mock; getGlobalBudgetSpend: jest.Mock };

const { send } = jest.requireMock('../send') as { send: jest.Mock };

const SETTINGS = { budgetAlerts: true } as never;
const MOCK_DB = {} as never;

describe('checkBudgetAlerts — global budget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageState.clear();
  });

  it('does nothing when global budget is null', async () => {
    getGlobalBudget.mockResolvedValue(null);

    await checkBudgetAlerts(MOCK_DB, SETTINGS);

    expect(getGlobalBudgetSpend).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('does nothing when global budget is 0', async () => {
    getGlobalBudget.mockResolvedValue(0);

    await checkBudgetAlerts(MOCK_DB, SETTINGS);

    expect(getGlobalBudgetSpend).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('does nothing when spent is below 80%', async () => {
    getGlobalBudget.mockResolvedValue(100_000);
    getGlobalBudgetSpend.mockResolvedValue(79_000);

    await checkBudgetAlerts(MOCK_DB, SETTINGS);

    expect(send).not.toHaveBeenCalled();
  });

  it('sends the 80% alert when spent reaches 80% and deduplicates on second call', async () => {
    getGlobalBudget.mockResolvedValue(100_000);
    getGlobalBudgetSpend.mockResolvedValue(85_000);

    await checkBudgetAlerts(MOCK_DB, SETTINGS);
    await checkBudgetAlerts(MOCK_DB, SETTINGS);

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends only the 80% alert when spent is between 80% and 100%', async () => {
    getGlobalBudget.mockResolvedValue(100_000);
    getGlobalBudgetSpend.mockResolvedValue(90_000);

    await checkBudgetAlerts(MOCK_DB, SETTINGS);

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends both alerts when spent reaches 100% for the first time', async () => {
    getGlobalBudget.mockResolvedValue(100_000);
    getGlobalBudgetSpend.mockResolvedValue(100_000);

    await checkBudgetAlerts(MOCK_DB, SETTINGS);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('deduplicates the 100% alert on subsequent calls', async () => {
    getGlobalBudget.mockResolvedValue(100_000);
    getGlobalBudgetSpend.mockResolvedValue(110_000);

    await checkBudgetAlerts(MOCK_DB, SETTINGS);
    await checkBudgetAlerts(MOCK_DB, SETTINGS);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('skips all checks when budgetAlerts setting is false', async () => {
    getGlobalBudget.mockResolvedValue(100_000);
    getGlobalBudgetSpend.mockResolvedValue(100_000);

    await checkBudgetAlerts(MOCK_DB, { budgetAlerts: false } as never);

    expect(send).not.toHaveBeenCalled();
    expect(getGlobalBudget).not.toHaveBeenCalled();
  });
});
