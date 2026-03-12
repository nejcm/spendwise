import { getCurrentMonthRange } from '@/lib/date/helpers';

describe('getCurrentMonthRange', () => {
  it('returns start of month and start of next month', () => {
    expect(getCurrentMonthRange('2026-03')).toEqual(['2026-03-01', '2026-04-01']);
  });

  it('pads next month with leading zero', () => {
    expect(getCurrentMonthRange('2026-09')).toEqual(['2026-09-01', '2026-10-01']);
  });

  it('rolls over to next year for December', () => {
    expect(getCurrentMonthRange('2026-12')).toEqual(['2026-12-01', '2027-01-01']);
  });
});
