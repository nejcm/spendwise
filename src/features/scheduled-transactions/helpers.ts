import type { ScheduledTransaction, ScheduledTransactionFormData } from './types';
import type { CurrencyKey } from '@/features/currencies';
import { addDays, endOfMonth, format, parseISO } from 'date-fns';
import { centsToAmount } from '@/features/formatting/helpers';
import { unixToISODate } from '@/lib/date/helpers';
import { advanceScheduledDate, getFirstDueOnOrAfter, isoDateToUnix } from './scheduler';

type Schedule = Pick<ScheduledTransaction, 'frequency' | 'next_due_date' | 'end_date' | 'is_active'>;

const iso = (date: Date) => format(date, 'yyyy-MM-dd');

/** ISO due dates of an active rule within `[from, to]`, stepping like the scheduler does. */
export function dueDatesBetween(rule: Schedule, from: string, to: string): string[] {
  if (!rule.is_active) return [];
  const end = rule.end_date != null ? unixToISODate(rule.end_date) : null;
  const last = end && end < to ? end : to;
  const dates: string[] = [];
  for (let date = unixToISODate(rule.next_due_date); date <= last; date = advanceScheduledDate(date, rule.frequency)) {
    if (date >= from) dates.push(date);
  }
  return dates;
}

export type Committed = { bills: number; comingIn: number };

/** Every remaining occurrence in the calendar month `yearMonth`, in Preferred Currency; unconvertible rules are skipped. */
export function committedForMonth(
  rules: (Schedule & Pick<ScheduledTransaction, 'type' | 'amount' | 'currency'>)[],
  yearMonth: string,
  toPreferred: (cents: number, currency: CurrencyKey) => number | null,
): Committed {
  const from = `${yearMonth}-01`;
  const to = iso(endOfMonth(parseISO(from)));
  const committed: Committed = { bills: 0, comingIn: 0 };
  for (const rule of rules) {
    const count = dueDatesBetween(rule, from, to).length;
    const amount = count ? toPreferred(rule.amount, rule.currency) : null;
    if (amount == null) continue;
    if (rule.type === 'expense') committed.bills += count * amount;
    else committed.comingIn += count * amount;
  }
  return committed;
}

export const SOON_DAYS = 7;

export type RuleGroup<T> = { key: 'soon' | 'paused' | `month:${string}`; rules: T[] };

/** Active rules due within the next 7 days, then by due month; paused (or ended) rules last. */
export function groupRules<T extends Pick<ScheduledTransaction, 'is_active' | 'next_due_date'>>(rules: T[], today: string): RuleGroup<T>[] {
  const soonEnd = iso(addDays(parseISO(today), SOON_DAYS));
  const groups = new Map<RuleGroup<T>['key'], T[]>();
  const add = (key: RuleGroup<T>['key'], rule: T) => groups.set(key, [...(groups.get(key) ?? []), rule]);

  const active = rules.filter((r) => r.is_active).sort((a, b) => a.next_due_date - b.next_due_date);
  for (const rule of active) {
    const due = unixToISODate(rule.next_due_date);
    add(due < soonEnd ? 'soon' : `month:${due.slice(0, 7)}`, rule);
  }
  for (const rule of rules) {
    if (!rule.is_active) add('paused', rule);
  }
  return [...groups].map(([key, list]) => ({ key, rules: list }));
}

/** False once the end date leaves no occurrence on or after today. */
export function canResume(rule: Pick<ScheduledTransaction, 'start_date' | 'end_date' | 'frequency'>, today: string): boolean {
  return getFirstDueOnOrAfter({
    startDate: unixToISODate(rule.start_date),
    frequency: rule.frequency,
    targetDate: today,
    endDate: rule.end_date != null ? unixToISODate(rule.end_date) : null,
  }) !== null;
}

export function daysUntil(dueUnix: number, today: string): number {
  return Math.round((dueUnix - isoDateToUnix(today)) / 86_400);
}

export function ruleToFormData(rule: ScheduledTransaction, overrides: Partial<ScheduledTransactionFormData> = {}): ScheduledTransactionFormData {
  return {
    account_id: rule.account_id,
    category_id: rule.category_id,
    type: rule.type,
    amount: centsToAmount(rule.amount),
    currency: rule.currency,
    note: rule.note,
    frequency: rule.frequency,
    start_date: rule.start_date,
    end_date: rule.end_date,
    is_active: !!rule.is_active,
    ...overrides,
  };
}
