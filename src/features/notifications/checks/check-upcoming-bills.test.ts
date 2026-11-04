import { calendarDateToUnix } from '@/lib/date/helpers';
import { createTestDb } from '@/test-utils/sqlite-db';
import { checkUpcomingBills } from './check-upcoming-bills';

const mockStorageState = new Map<string, string>();

jest.mock('../send', () => ({ send: jest.fn() }));
jest.mock('@/lib/storage', () => ({
  storage: {
    getString: (key: string) => mockStorageState.get(key),
    set: (key: string, value: string) => mockStorageState.set(key, value),
  },
}));

const { send } = jest.requireMock('../send') as { send: jest.Mock };
const nov = (day: number) => calendarDateToUnix(new Date(2026, 10, day));

async function seedRules() {
  const db = await createTestDb();
  await db.execAsync(`
    INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR');
    INSERT INTO categories (id, name, color) VALUES ('cat_rent', 'Rent', '#000000'), ('cat_gym', 'Gym', '#000000'), ('cat_salary', 'Salary', '#000000');
  `);
  const rules: [id: string, type: string, categoryId: string | null, due: number, active: number][] = [
    ['r_today', 'expense', 'cat_rent', nov(4), 1],
    ['r_last_day', 'expense', 'cat_gym', nov(11), 1],
    ['r_past_window', 'expense', 'cat_gym', nov(12), 1],
    ['r_overdue', 'expense', 'cat_gym', nov(3), 1],
    ['r_income', 'income', 'cat_salary', nov(5), 1],
    ['r_paused', 'expense', 'cat_gym', nov(5), 0],
    ['r_muted', 'expense', 'cat_gym', nov(5), 1],
  ];
  for (const [id, type, categoryId, due, active] of rules) {
    await db.runAsync(
      `INSERT INTO recurring_rules (id, account_id, category_id, type, amount, currency, frequency, start_date, next_due_date, is_active)
       VALUES (?, 'acc_1', ?, ?, 5000, 'EUR', 'monthly', ?, ?, ?)`,
      [id, categoryId, type, due, due, active],
    );
  }
  return db;
}

describe('checkUpcomingBills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageState.clear();
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 4, 9));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('alerts active, unmuted expense rules due from today through the window end', async () => {
    const db = await seedRules();

    await checkUpcomingBills(db as any, { upcomingBillsDays: 7, mutedBillRules: ['r_muted'] });

    expect(send.mock.calls.map(([, body]) => body)).toEqual([
      'Rent is due today.',
      expect.stringMatching(/^Gym is due on /),
    ]);
  });

  it('alerts each due date once, however often the check runs', async () => {
    const db = await seedRules();
    const settings = { upcomingBillsDays: 7 as const, mutedBillRules: ['r_muted'] };

    await checkUpcomingBills(db as any, settings);
    await checkUpcomingBills(db as any, settings);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('sends nothing when upcoming bill alerts are off', async () => {
    const db = await seedRules();

    await checkUpcomingBills(db as any, { upcomingBills: false });

    expect(send).not.toHaveBeenCalled();
  });
});
