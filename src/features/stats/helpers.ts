import type { BudgetPeriodSelection, MonthSlice } from './types';
import { format } from 'date-fns';

const MAX_MONTH_SLICES = 36;

export function expandToMonthSlices(selection: BudgetPeriodSelection): MonthSlice[] {
  if (selection.mode === 'month') {
    return [{ year: selection.year, month: selection.month }];
  }
  if (selection.mode === 'year') {
    return Array.from({ length: 12 }, (_, i) => ({ year: selection.year, month: i + 1 }));
  }
  const slices: MonthSlice[] = [];
  let y = selection.startYear;
  let m = selection.startMonth;
  while (y < selection.endYear || (y === selection.endYear && m <= selection.endMonth)) {
    slices.push({ year: y, month: m });
    if (slices.length === MAX_MONTH_SLICES) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return slices;
}

export function defaultBudgetPeriodSelection(): BudgetPeriodSelection {
  const now = new Date();
  return { mode: 'month', year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function budgetPeriodLabel(selection: BudgetPeriodSelection): string {
  if (selection.mode === 'month') {
    return format(new Date(selection.year, selection.month - 1, 1), 'MMMM yyyy');
  }
  if (selection.mode === 'year') {
    return String(selection.year);
  }
  const start = new Date(selection.startYear, selection.startMonth - 1, 1);
  const end = new Date(selection.endYear, selection.endMonth - 1, 1);
  return `${format(start, 'MMM yyyy')} – ${format(end, 'MMM yyyy')}`;
}
