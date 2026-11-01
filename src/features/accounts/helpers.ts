import type { AccountType, AccountWithBalance } from './types';
import { buildDailyBalances } from '@/features/home/helpers';

const DAY = 86_400;

type BalanceSeries = { opening: number; deltas: { date: number; delta: number }[] };

export type BalanceSummary = {
  values: number[];
  start: number;
  lastDay: number;
  opening: number;
  /** Balance at the end of the period, future-dated rows included. */
  closing: number;
  low: { value: number; index: number; date: number };
};

/** Undefined bounds mean all time: the line then starts on the first transaction day. */
export function summarizeBalance(series: BalanceSeries, startDate: number | undefined, endDate: number | undefined, today: number): BalanceSummary {
  const firstDate = series.deltas[0]?.date;
  const start = startDate ?? (firstDate === undefined ? today : Math.floor(firstDate / DAY) * DAY);
  const lastDay = endDate === undefined ? today : Math.min(today, endDate - DAY);
  const values = buildDailyBalances(series.opening, series.deltas, start, lastDay);
  let lowIndex = 0;
  values.forEach((value, i) => {
    if (value < values[lowIndex]) lowIndex = i;
  });
  return {
    values,
    start,
    lastDay,
    opening: series.opening,
    closing: series.deltas.reduce((sum, { delta }) => sum + delta, series.opening),
    low: { value: values[lowIndex], index: lowIndex, date: start + Math.max(0, lowIndex - 1) * DAY },
  };
}

/** Shares of the positive balances, largest first; debts are left out of the bar. */
export function allocationByType(accounts: Pick<AccountWithBalance, 'type' | 'baseBalance'>[]): { type: AccountType; share: number }[] {
  const totals = new Map<AccountType, number>();
  for (const { type, baseBalance } of accounts) {
    if (baseBalance > 0) totals.set(type, (totals.get(type) ?? 0) + baseBalance);
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals].map(([type, total]) => ({ type, share: total / sum })).sort((a, b) => b.share - a.share);
}
