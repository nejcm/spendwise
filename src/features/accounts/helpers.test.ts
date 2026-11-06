import { allocationByType, summarizeBalance } from './helpers';

const DAY = 86_400;
const OCT_1 = Date.UTC(2026, 9, 1) / 1000;
const NOV_1 = Date.UTC(2026, 10, 1) / 1000;

describe('summarizeBalance', () => {
  const series = {
    opening: 150_000,
    adjusted: 0,
    deltas: [
      { date: OCT_1, delta: -82_000 },
      { date: OCT_1 + 23 * DAY, delta: -56_596 },
      { date: OCT_1 + 24 * DAY, delta: 285_000 },
    ],
  };

  it('keeps opening-balance entries out of the net but in the closing balance', () => {
    const summary = summarizeBalance({ opening: 0, adjusted: 1_000, deltas: [{ date: OCT_1, delta: 1_300 }] }, OCT_1, NOV_1, NOV_1);

    expect(summary.net).toBe(300);
    expect(summary.closing).toBe(1_300);
  });

  it('runs from the opening balance to today', () => {
    const summary = summarizeBalance(series, OCT_1, NOV_1, OCT_1 + 30 * DAY);

    expect(summary.values).toHaveLength(32);
    expect(summary.opening).toBe(150_000);
    expect(summary.closing).toBe(296_404);
    expect(summary.values[24]).toBe(11_404);
  });

  it('stops a past period at its last day and still closes with every change', () => {
    const summary = summarizeBalance({ opening: 0, adjusted: 0, deltas: [{ date: OCT_1 + 5 * DAY, delta: -500 }] }, OCT_1, NOV_1, NOV_1 + 40 * DAY);

    expect(summary.lastDay).toBe(NOV_1 - DAY);
    expect(summary.values).toHaveLength(32);
    expect(summary.closing).toBe(-500);
  });

  it('closes with future-dated rows the line has not reached yet', () => {
    const summary = summarizeBalance({ opening: 100, adjusted: 0, deltas: [{ date: OCT_1 + 20 * DAY, delta: 50 }] }, OCT_1, NOV_1, OCT_1 + 2 * DAY);

    expect(summary.values).toEqual([100, 100, 100, 100]);
    expect(summary.closing).toBe(150);
  });

  it('starts an all-time series on the first transaction day', () => {
    const summary = summarizeBalance({ opening: 0, adjusted: 0, deltas: [{ date: OCT_1 + 3600, delta: 700 }] }, undefined, undefined, OCT_1 + 2 * DAY);

    expect(summary.start).toBe(OCT_1);
    expect(summary.values).toEqual([0, 700, 700, 700]);
  });

  it('keeps a single point for a period that has not started', () => {
    const summary = summarizeBalance({ opening: 42, adjusted: 0, deltas: [] }, NOV_1, NOV_1 + 30 * DAY, OCT_1);

    expect(summary.values).toEqual([42]);
    expect(summary.closing).toBe(42);
  });
});

describe('allocationByType', () => {
  it('groups positive balances by type, largest first', () => {
    const shares = allocationByType([
      { type: 'checking', baseBalance: 231_645 },
      { type: 'savings', baseBalance: 500_000 },
      { type: 'cash', baseBalance: 8_430 },
      { type: 'credit_card', baseBalance: -12_000 },
    ]);

    expect(shares.map(({ type }) => type)).toEqual(['savings', 'checking', 'cash']);
    expect(shares.map(({ share }) => Math.round(share * 100))).toEqual([68, 31, 1]);
  });

  it('sums accounts of the same type', () => {
    expect(allocationByType([{ type: 'cash', baseBalance: 1 }, { type: 'cash', baseBalance: 3 }])).toEqual([{ type: 'cash', share: 1 }]);
  });

  it('is empty without a positive balance', () => {
    expect(allocationByType([{ type: 'cash', baseBalance: 0 }, { type: 'credit_card', baseBalance: -5 }])).toEqual([]);
  });
});
