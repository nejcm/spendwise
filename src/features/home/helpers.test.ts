import type { ScheduledTransactionWithDetails } from '@/features/scheduled-transactions/types';
import { budgetOutlook, buildDailyBalances, buildLinePath, chartPoints, getGreetingPeriod, getSetupSteps, selectNextBill } from './helpers';

const DAY = 86_400;
const OCT_1 = Date.UTC(2026, 9, 1) / 1000;
const OCT_31 = Date.UTC(2026, 9, 31) / 1000;
const NOV_1 = Date.UTC(2026, 10, 1) / 1000;

describe('buildDailyBalances', () => {
  it('starts at the opening balance and closes each day up to today', () => {
    const deltas = [{ date: OCT_1, delta: -100 }, { date: OCT_1 + 2 * DAY, delta: 500 }];
    expect(buildDailyBalances(1000, deltas, OCT_1, OCT_1 + 3 * DAY)).toEqual([1000, 900, 900, 1400, 1400]);
  });

  it('ignores rows after today and before the start', () => {
    const deltas = [{ date: OCT_1 - DAY, delta: 1 }, { date: OCT_1 + 5 * DAY, delta: 1 }];
    expect(buildDailyBalances(0, deltas, OCT_1, OCT_1)).toEqual([0, 0]);
  });

  it('buckets non-midnight dates into their day', () => {
    expect(buildDailyBalances(0, [{ date: OCT_1 + 3600, delta: 7 }], OCT_1, OCT_1 + DAY)).toEqual([0, 7, 7]);
  });
});

describe('buildLinePath', () => {
  it('spans the width and maps the max to the top inset', () => {
    expect(buildLinePath(chartPoints([0, 10], 100, 64))).toBe('M0.0 56.0 L100.0 8.0');
  });

  it('draws a flat series through the middle', () => {
    expect(buildLinePath(chartPoints([5, 5, 5], 10, 64))).toBe('M0.0 32.0 L5.0 32.0 L10.0 32.0');
    expect(buildLinePath(chartPoints([0, 0], 10, 64))).toBe('M0.0 32.0 L10.0 32.0');
  });

  it('needs two points and a width', () => {
    expect(buildLinePath(chartPoints([1], 100, 64))).toBe('');
    expect(buildLinePath(chartPoints([1, 2], 0, 64))).toBe('');
  });
});

describe('chartPoints', () => {
  it('keeps a small change gentle against a large balance', () => {
    const [[, from], [, to]] = chartPoints([100_000, 99_000], 100, 64);
    expect(from).toBeCloseTo(27.2);
    expect(to).toBeCloseTo(36.8);
  });

  it('uses the full height once the change beats the floor', () => {
    expect(chartPoints([100_000, 50_000], 100, 64).map(([, y]) => y)).toEqual([8, 56]);
  });

  it('floors the range by magnitude across zero', () => {
    const [[, from], [, to]] = chartPoints([-100, -99], 100, 64);
    expect(from).toBeCloseTo(36.8);
    expect(to).toBeCloseTo(27.2);
  });
});

function rule(overrides: Partial<ScheduledTransactionWithDetails>): ScheduledTransactionWithDetails {
  return {
    id: 'r',
    account_id: 'acc_1',
    category_id: 'cat',
    type: 'expense',
    amount: 1000,
    currency: 'EUR',
    note: null,
    frequency: 'monthly',
    start_date: OCT_1,
    end_date: null,
    next_due_date: NOV_1,
    is_active: 1,
    created_at: 0,
    updated_at: 0,
    account_icon: null,
    account_name: null,
    category_color: null,
    category_icon: null,
    category_name: null,
    ...overrides,
  };
}

describe('selectNextBill', () => {
  const active = new Set(['acc_1']);

  it('picks the earliest active expense and counts the rest of its month', () => {
    const rules = [
      rule({ id: 'later', next_due_date: NOV_1 + 10 * DAY }),
      rule({ id: 'rent', next_due_date: NOV_1 }),
      rule({ id: 'december', next_due_date: NOV_1 + 40 * DAY }),
      rule({ id: 'salary', type: 'income', next_due_date: OCT_31 }),
      rule({ id: 'paused', is_active: 0, next_due_date: OCT_31 }),
      rule({ id: 'archived', account_id: 'acc_archived', next_due_date: OCT_31 }),
    ];
    expect(selectNextBill(rules, active, OCT_31)).toMatchObject({ rule: { id: 'rent' }, daysUntil: 1, moreInMonth: 1 });
  });

  it('clamps an overdue bill to today', () => {
    expect(selectNextBill([rule({ next_due_date: OCT_31 - DAY })], active, OCT_31)?.daysUntil).toBe(0);
  });

  it('is null without a qualifying rule', () => {
    expect(selectNextBill([rule({ type: 'income' })], active, OCT_31)).toBeNull();
  });
});

describe('getSetupSteps', () => {
  it('reflects each piece of state', () => {
    const steps = getSetupSteps({ profileName: 'Nejc', hasTransactions: false, hasBudget: true, accountCount: 1 });
    expect(steps).toEqual([
      { key: 'profile', done: true },
      { key: 'transaction', done: false },
      { key: 'budget', done: true },
      { key: 'accounts', done: false },
    ]);
  });

  it('needs a non-blank name and a second account', () => {
    const steps = getSetupSteps({ profileName: '  ', hasTransactions: true, hasBudget: false, accountCount: 2 });
    expect(steps.map((step) => step.done)).toEqual([false, true, false, true]);
  });
});

describe('getGreetingPeriod', () => {
  it('maps hours to periods', () => {
    expect([4, 5, 11, 12, 17, 18].map(getGreetingPeriod)).toEqual(['evening', 'morning', 'morning', 'afternoon', 'afternoon', 'evening']);
  });
});

describe('budgetOutlook', () => {
  const base = { limit: 200_000, billsPaid: 84_900, billsComing: 3_297, totalDays: 30 };

  it('is on track early in the month and spreads what is safe over the days left', () => {
    expect(budgetOutlook({ ...base, spent: 94_540, daysLeft: 27 })).toEqual({ state: 'on_track', perDay: 3_783, left: 105_460 });
  });

  it('flags spending ahead of the everyday pace', () => {
    const outlook = budgetOutlook({ ...base, spent: 160_000, daysLeft: 13 });
    expect(outlook).toMatchObject({ state: 'fast', perDay: 2_823, overPace: 8_018, plannedPerDay: 3_727 });
  });

  it('counts today as elapsed so first-day spending within the daily share stays on track', () => {
    expect(budgetOutlook({ ...base, billsPaid: 0, billsComing: 0, spent: 6_000, daysLeft: 30 })).toMatchObject({ state: 'on_track' });
  });

  it('reports the amount over once spending passes the budget', () => {
    expect(budgetOutlook({ ...base, spent: 209_439, daysLeft: 4 })).toEqual({ state: 'over', over: 9_439, left: 0 });
  });

  it('counts bills still to come against the budget', () => {
    expect(budgetOutlook({ ...base, spent: 199_000, daysLeft: 4 })).toEqual({ state: 'over', over: 2_297, left: 0 });
  });
});
