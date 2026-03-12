export function getCurrentMonthRange(month: string): [string, string] {
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01`;
  const nextMonth = Number(m) === 12 ? `${Number(year) + 1}-01-01` : `${year}-${String(Number(m) + 1).padStart(2, '0')}-01`;
  return [startDate, nextMonth];
}
