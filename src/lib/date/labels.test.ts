import { getPeriodLabel } from '@/lib/date/labels';

describe('getPeriodLabel', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 2, 15, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('labels dynamic today as Today', () => {
    expect(getPeriodLabel({ mode: 'today' })).toBe('Today');
  });

  it('labels fixed nearby days relatively', () => {
    expect(getPeriodLabel({ mode: 'day', date: '2026-03-14' })).toBe('Yesterday');
    expect(getPeriodLabel({ mode: 'day', date: '2026-03-15' })).toBe('Today');
    expect(getPeriodLabel({ mode: 'day', date: '2026-03-16' })).toBe('Tomorrow');
  });

  it('labels other fixed days as a formatted date', () => {
    expect(getPeriodLabel({ mode: 'day', date: '2026-03-20' })).toBe('Mar 20, 2026');
  });
});
