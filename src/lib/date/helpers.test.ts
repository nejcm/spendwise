import { getCurrentMonthRange } from '@/lib/date/helpers';

describe('getCurrentMonthRange', () => {
  it('returns start of month and start of next month', () => {
    expect(getCurrentMonthRange('2026-03')).toEqual([new Date(2026, 2, 1).getTime() / 1000, new Date(2026, 3, 1).getTime() / 1000]);
  });

  it('pads next month with leading zero', () => {
    expect(getCurrentMonthRange('2026-09')).toEqual([new Date(2026, 8, 1).getTime() / 1000, new Date(2026, 9, 1).getTime() / 1000]);
  });

  it('rolls over to next year for December', () => {
    expect(getCurrentMonthRange('2026-12')).toEqual([new Date(2026, 11, 1).getTime() / 1000, new Date(2027, 0, 1).getTime() / 1000]);
  });
});
