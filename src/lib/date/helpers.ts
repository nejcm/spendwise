/**
 * Get the start and end date of a month.
 * @param yearMonth - The year and month in the format "YYYY-MM".
 * @returns An array with the start and end date of the month.
 */
export function getCurrentMonthRange(yearMonth: string): [string, string] {
  const [year, m] = yearMonth.split('-');
  const startDate = `${year}-${m}-01`;
  const nextMonth = Number(m) === 12 ? `${Number(year) + 1}-01-01` : `${year}-${String(Number(m) + 1).padStart(2, '0')}-01`;
  return [startDate, nextMonth];
}
