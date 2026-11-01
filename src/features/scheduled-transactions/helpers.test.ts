import type { ScheduledTransaction } from './types';
import { canResume, committedForMonth, dueDatesBetween, groupRules } from './helpers';
import { isoDateToUnix } from './scheduler';

function rule(overrides: Partial<ScheduledTransaction> & { due: string }): ScheduledTransaction {
  const { due, ...rest } = overrides;
  return {
    id: due,
    account_id: 'acc',
    category_id: 'cat',
    type: 'expense',
    amount: 1000,
    currency: 'EUR',
    note: null,
    frequency: 'monthly',
    start_date: isoDateToUnix(due),
    end_date: null,
    next_due_date: isoDateToUnix(due),
    is_active: 1,
    created_at: 0,
    updated_at: 0,
    ...rest,
  };
}

describe('dueDatesBetween', () => {
  it('walks every occurrence inside the window and stops at the end date', () => {
    expect(dueDatesBetween(rule({ due: '2026-11-25', frequency: 'weekly' }), '2026-12-01', '2026-12-31'))
      .toEqual(['2026-12-02', '2026-12-09', '2026-12-16', '2026-12-23', '2026-12-30']);
    expect(dueDatesBetween(rule({ due: '2026-12-01', frequency: 'weekly', end_date: isoDateToUnix('2026-12-10') }), '2026-12-01', '2026-12-31'))
      .toEqual(['2026-12-01', '2026-12-08']);
  });

  it('returns nothing for paused rules', () => {
    expect(dueDatesBetween(rule({ due: '2026-12-01', is_active: 0 }), '2026-12-01', '2026-12-31')).toEqual([]);
  });
});

describe('committedForMonth', () => {
  it('sums bills and income per occurrence in Preferred Currency, skipping unconvertible rules', () => {
    const rules = [
      rule({ due: '2026-12-01', amount: 82000 }),
      rule({ due: '2026-11-28', frequency: 'weekly', amount: 1000 }),
      rule({ due: '2026-12-25', type: 'income', amount: 285000 }),
      rule({ due: '2026-12-05', currency: 'USD', amount: 1299 }),
      rule({ due: '2026-12-06', currency: 'GBP', amount: 999 }),
      rule({ due: '2027-01-01', amount: 5000 }),
      rule({ due: '2026-12-02', amount: 999, is_active: 0 }),
    ];
    const toPreferred = (cents: number, currency: string) => currency === 'EUR' ? cents : currency === 'USD' ? Math.round(cents * 0.846) : null;

    expect(committedForMonth(rules, '2026-12', toPreferred)).toEqual({
      bills: 82000 + 4 * 1000 + 1099,
      comingIn: 285000,
    });
  });
});

describe('groupRules', () => {
  it('splits active rules into the next 7 days and later months, paused last', () => {
    const rules = [
      rule({ due: '2026-11-23' }),
      rule({ due: '2026-11-02' }),
      rule({ due: '2026-10-30', is_active: 0 }),
      rule({ due: '2026-11-07' }),
      rule({ due: '2026-11-08' }),
      rule({ due: '2027-03-01' }),
    ];
    expect(groupRules(rules, '2026-11-01').map((g) => [g.key, g.rules.map((r) => r.id)])).toEqual([
      ['soon', ['2026-11-02', '2026-11-07']],
      ['month:2026-11', ['2026-11-08', '2026-11-23']],
      ['month:2027-03', ['2027-03-01']],
      ['paused', ['2026-10-30']],
    ]);
  });
});

describe('canResume', () => {
  it('is false once the end date has passed every occurrence', () => {
    expect(canResume(rule({ due: '2026-01-01' }), '2026-11-01')).toBe(true);
    expect(canResume(rule({ due: '2026-01-01', end_date: isoDateToUnix('2026-10-15') }), '2026-11-01')).toBe(false);
  });
});
