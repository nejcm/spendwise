import type { ScheduledTransactionWithDetails } from '@/features/scheduled-transactions/types';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

const DAY = 86_400;

/** `monthIndex` is 0-based, as from `Date#getMonth`. */
export function monthName(monthIndex: number): string {
  return translate(`date.months.m${monthIndex + 1}` as TxKeyPath);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** `[opening, close of day 1, …, close of today]`; dates are UTC-midnight Unix seconds. */
export function buildDailyBalances(opening: number, deltas: { date: number; delta: number }[], start: number, today: number): number[] {
  const days = Math.max(0, Math.floor((today - start) / DAY) + 1);
  const perDay = Array.from<number>({ length: days }).fill(0);
  for (const { date, delta } of deltas) {
    const index = Math.floor((date - start) / DAY);
    if (index >= 0 && index < days) perDay[index] += delta;
  }
  const balances = [opening];
  for (const delta of perDay) balances.push(balances[balances.length - 1] + delta);
  return balances;
}

export function buildLinePath(values: number[], width: number, height: number, inset = 8): string {
  if (values.length < 2 || width <= 0) return '';
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  const step = width / (values.length - 1);
  const y = (value: number) => range === 0 ? height / 2 : inset + (1 - (value - min) / range) * (height - inset * 2);
  return values.map((value, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${y(value).toFixed(1)}`).join(' ');
}

export type NextBill = {
  rule: ScheduledTransactionWithDetails;
  daysUntil: number;
  /** Other upcoming bills due in the same calendar month as `rule`. */
  moreInMonth: number;
};

export function selectNextBill(rules: ScheduledTransactionWithDetails[], activeAccountIds: ReadonlySet<string>, today: number): NextBill | null {
  const bills = rules
    .filter((rule) => !!rule.is_active && rule.type === 'expense' && activeAccountIds.has(rule.account_id))
    .sort((a, b) => a.next_due_date - b.next_due_date);
  const [next, ...rest] = bills;
  if (!next) return null;
  const due = new Date(next.next_due_date * 1000);
  const sameMonth = (rule: ScheduledTransactionWithDetails) => {
    const date = new Date(rule.next_due_date * 1000);
    return date.getUTCFullYear() === due.getUTCFullYear() && date.getUTCMonth() === due.getUTCMonth();
  };
  return {
    rule: next,
    daysUntil: Math.max(0, Math.round((next.next_due_date - today) / DAY)),
    moreInMonth: rest.filter(sameMonth).length,
  };
}

export type SetupStepKey = 'profile' | 'transaction' | 'budget' | 'accounts';

export function getSetupSteps(state: { profileName: string; hasTransactions: boolean; hasBudget: boolean; accountCount: number }): { key: SetupStepKey; done: boolean }[] {
  return [
    { key: 'profile', done: state.profileName.trim().length > 0 },
    { key: 'transaction', done: state.hasTransactions },
    { key: 'budget', done: state.hasBudget },
    { key: 'accounts', done: state.accountCount > 1 },
  ];
}

export function getGreetingPeriod(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}
