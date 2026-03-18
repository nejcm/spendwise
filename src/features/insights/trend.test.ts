import { buildTrendSeries } from '@/features/insights/trend';
import { isoDateToUnix } from '@/features/scheduled-transactions/scheduler';

const d = isoDateToUnix;

describe('buildTrendSeries', () => {
  it('builds daily buckets for week mode', () => {
    expect(
      buildTrendSeries('week', d('2026-03-16'), d('2026-03-23'), [
        { date: d('2026-03-16'), income: 1000, expense: 500 },
        { date: d('2026-03-18'), income: 300, expense: 200 },
        { date: d('2026-03-22'), income: 0, expense: 700 },
      ]),
    ).toEqual([
      { label: 'Mon', income: 1000, expense: 500 },
      { label: 'Tue', income: 0, expense: 0 },
      { label: 'Wed', income: 300, expense: 200 },
      { label: 'Thu', income: 0, expense: 0 },
      { label: 'Fri', income: 0, expense: 0 },
      { label: 'Sat', income: 0, expense: 0 },
      { label: 'Sun', income: 0, expense: 700 },
    ]);
  });

  it('builds weekly buckets for month mode', () => {
    expect(
      buildTrendSeries('month', d('2026-03-01'), d('2026-04-01'), [
        { date: d('2026-03-01'), income: 1000, expense: 0 },
        { date: d('2026-03-07'), income: 200, expense: 150 },
        { date: d('2026-03-08'), income: 500, expense: 100 },
        { date: d('2026-03-31'), income: 0, expense: 900 },
      ]),
    ).toEqual([
      { label: 'W1', income: 1200, expense: 150 },
      { label: 'W2', income: 500, expense: 100 },
      { label: 'W3', income: 0, expense: 0 },
      { label: 'W4', income: 0, expense: 0 },
      { label: 'W5', income: 0, expense: 900 },
    ]);
  });

  it('builds monthly buckets for year mode', () => {
    expect(
      buildTrendSeries('year', d('2026-01-01'), d('2027-01-01'), [
        { date: d('2026-01-10'), income: 100, expense: 10 },
        { date: d('2026-03-15'), income: 300, expense: 30 },
      ]),
    ).toEqual([
      { label: 'Jan', income: 100, expense: 10 },
      { label: 'Feb', income: 0, expense: 0 },
      { label: 'Mar', income: 300, expense: 30 },
      { label: 'Apr', income: 0, expense: 0 },
      { label: 'May', income: 0, expense: 0 },
      { label: 'Jun', income: 0, expense: 0 },
      { label: 'Jul', income: 0, expense: 0 },
      { label: 'Aug', income: 0, expense: 0 },
      { label: 'Sep', income: 0, expense: 0 },
      { label: 'Oct', income: 0, expense: 0 },
      { label: 'Nov', income: 0, expense: 0 },
      { label: 'Dec', income: 0, expense: 0 },
    ]);
  });

  it('builds monthly buckets for longer custom ranges', () => {
    expect(
      buildTrendSeries('custom', d('2026-01-15'), d('2026-04-15'), [
        { date: d('2026-01-20'), income: 100, expense: 10 },
        { date: d('2026-02-02'), income: 200, expense: 20 },
        { date: d('2026-03-18'), income: 300, expense: 30 },
        { date: d('2026-04-01'), income: 400, expense: 40 },
      ]),
    ).toEqual([
      { label: 'Jan', income: 100, expense: 10 },
      { label: 'Feb', income: 200, expense: 20 },
      { label: 'Mar', income: 300, expense: 30 },
      { label: 'Apr', income: 400, expense: 40 },
    ]);
  });

  it('includes year context for custom ranges spanning multiple years', () => {
    expect(
      buildTrendSeries('custom', d('2026-12-15'), d('2027-02-15'), [
        { date: d('2026-12-20'), income: 100, expense: 10 },
        { date: d('2027-01-10'), income: 200, expense: 20 },
        { date: d('2027-02-01'), income: 300, expense: 30 },
      ]),
    ).toEqual([
      { label: 'Dec 26', income: 100, expense: 10 },
      { label: 'Jan 27', income: 200, expense: 20 },
      { label: 'Feb 27', income: 300, expense: 30 },
    ]);
  });
});
