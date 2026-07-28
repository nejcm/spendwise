import type { DailyTrendTotal } from '@/features/insights/types';
import { buildSpendingPaceModel, getSpendingPaceMonthRange } from './spending-pace';

function expense(day: number, amount: number): DailyTrendTotal {
  return {
    date: Date.UTC(2026, 6, day) / 1000,
    income: 0,
    expense: amount,
  };
}

describe('spending pace model', () => {
  const today = new Date(2026, 6, 10);

  it('queries date-only transaction timestamps using UTC month boundaries', () => {
    expect(getSpendingPaceMonthRange(today)).toEqual([
      Date.UTC(2026, 6, 1) / 1000,
      Date.UTC(2026, 7, 1) / 1000,
    ]);
  });

  it('builds cumulative spending through today and budget pace through month end', () => {
    const model = buildSpendingPaceModel([expense(1, 30_000), expense(5, 20_000)], 310_000, today);

    expect(model.actual).toHaveLength(10);
    expect(model.actual[0]).toEqual({ day: 1, value: 30_000 });
    expect(model.actual[4]).toEqual({ day: 5, value: 50_000 });
    expect(model.actual[9]).toEqual({ day: 10, value: 50_000 });
    expect(model.budget).toHaveLength(31);
    expect(model.budget[9]).toEqual({ day: 10, value: 100_000, label: '10' });
    expect(model.budget[30]).toEqual({ day: 31, value: 310_000, label: '31' });
  });

  it('marks front-loaded spending as over pace', () => {
    const model = buildSpendingPaceModel([expense(1, 150_000)], 310_000, today);

    expect(model.spent).toBe(150_000);
    expect(model.variance).toBe(50_000);
    expect(model.status).toBe('over');
  });

  it('marks spending below and exactly on pace', () => {
    const below = buildSpendingPaceModel([expense(3, 40_000)], 310_000, today);
    const on = buildSpendingPaceModel([expense(3, 100_000)], 310_000, today);

    expect(below.status).toBe('below');
    expect(below.variance).toBe(-60_000);
    expect(on.status).toBe('on');
    expect(on.variance).toBe(0);
  });

  it('uses UTC calendar dates and ignores future and out-of-month expenses', () => {
    const rows = [
      expense(11, 50_000),
      {
        ...expense(5, 80_000),
        date: Date.UTC(2026, 5, 5) / 1000,
      },
    ];

    const model = buildSpendingPaceModel(rows, 310_000, today);

    expect(model.spent).toBe(0);
  });
});
