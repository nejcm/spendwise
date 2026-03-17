import {
  advanceScheduledDate,
  getFirstDueOnOrAfter,
  planScheduledRuns,
} from '@/features/scheduled-transactions/scheduler';

describe('scheduled transaction scheduler', () => {
  it('advances monthly dates using calendar semantics', () => {
    expect(advanceScheduledDate('2026-01-31', 'monthly')).toBe('2026-02-28');
    expect(advanceScheduledDate('2024-02-29', 'yearly')).toBe('2025-02-28');
  });

  it('finds the first due date on or after the target date', () => {
    expect(
      getFirstDueOnOrAfter({
        startDate: '2026-03-01',
        frequency: 'weekly',
        targetDate: '2026-03-16',
      }),
    ).toBe('2026-03-22');
  });

  it('returns null when the schedule already ended', () => {
    expect(
      getFirstDueOnOrAfter({
        startDate: '2026-03-01',
        frequency: 'weekly',
        targetDate: '2026-04-01',
        endDate: '2026-03-15',
      }),
    ).toBeNull();
  });

  it('plans catch-up dates and skips dates that were already posted', () => {
    expect(
      planScheduledRuns(
        {
          next_due_date: '2026-03-01',
          frequency: 'weekly',
          end_date: null,
          is_active: 1,
        },
        '2026-03-20',
        new Set(['2026-03-08']),
      ),
    ).toEqual({
      dueDates: ['2026-03-01', '2026-03-15'],
      isActive: true,
      nextDueDate: '2026-03-22',
    });
  });

  it('deactivates rules once the end date has been fully consumed', () => {
    expect(
      planScheduledRuns(
        {
          next_due_date: '2026-03-01',
          frequency: 'monthly',
          end_date: '2026-03-01',
          is_active: 1,
        },
        '2026-03-31',
      ),
    ).toEqual({
      dueDates: ['2026-03-01'],
      isActive: false,
      nextDueDate: '2026-04-01',
    });
  });
});
