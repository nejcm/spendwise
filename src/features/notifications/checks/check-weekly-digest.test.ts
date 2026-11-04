import { clearAppStore, setCurrency, setCurrencyFormat, setNumberFormat } from '@/lib/store/store';
import { checkWeeklyDigest } from './check-weekly-digest';

const mockStorageState = new Map<string, string>();

jest.mock('@/features/notifications/queries', () => ({ getWeeklySpendSummary: jest.fn() }));
jest.mock('../send', () => ({ send: jest.fn() }));
jest.mock('@/lib/storage', () => ({
  ...jest.requireActual<object>('@/lib/storage'),
  storage: {
    getString: (key: string) => mockStorageState.get(key),
    set: (key: string, value: string) => mockStorageState.set(key, value),
  },
}));

const { getWeeklySpendSummary } = jest.requireMock('@/features/notifications/queries') as { getWeeklySpendSummary: jest.Mock };
const { send } = jest.requireMock('../send') as { send: jest.Mock };
const MOCK_DB = {} as any;

describe('checkWeeklyDigest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAppStore();
    mockStorageState.clear();
    setCurrency('USD');
    setNumberFormat('stop');
    setCurrencyFormat('symbol-before');
    getWeeklySpendSummary.mockResolvedValue({ expense: 4_250, income: 50_000 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends the week totals once on Sunday, formatted in the preferred currency', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 8, 18));

    await checkWeeklyDigest(MOCK_DB, { weeklyDigest: true });
    await checkWeeklyDigest(MOCK_DB, { weeklyDigest: true });

    expect(send.mock.calls).toEqual([[expect.any(String), 'This week: $42.50 spent, $500 received.']]);
  });

  it('stays quiet on other days', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 7, 18));

    await checkWeeklyDigest(MOCK_DB, { weeklyDigest: true });

    expect(send).not.toHaveBeenCalled();
  });
});
