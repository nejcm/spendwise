const RE_NEWLINE = /\r?\n/;
const RE_NON_NUMERIC = /[^\d.-]/g;
const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;

/**
 * Minimal CSV parser - handles quoted fields and commas.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(RE_NEWLINE);

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    rows.push(parseCSVLine(line));
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      }
      else {
        inQuotes = !inQuotes;
      }
    }
    else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    }
    else {
      current += ch;
    }
  }

  fields.push(current.trim());
  return fields;
}

export type ColumnMapping = {
  date: number | null;
  amount: number | null;
  note: number | null;
  type: number | null; // column with "income"/"expense" or positive/negative
};

export type ParsedRow = {
  date: string;
  amount: number; // cents, positive = income, negative = expense
  note: string;
  isDuplicate?: boolean;
};

/**
 * Convert raw CSV rows to ParsedRow[] using column mapping.
 * Handles both signed amounts (negative = expense) and type columns.
 */
export function mapRows(rows: string[][], mapping: ColumnMapping, hasHeader: boolean): ParsedRow[] {
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const parsed: ParsedRow[] = [];

  for (const row of dataRows) {
    const rawDate = mapping.date !== null ? (row[mapping.date] ?? '') : '';
    const rawAmount = mapping.amount !== null ? (row[mapping.amount] ?? '') : '';
    const rawNote = mapping.note !== null ? (row[mapping.note] ?? '') : '';
    const rawType = mapping.type !== null ? (row[mapping.type] ?? '') : '';

    if (!rawDate || !rawAmount) {
      continue;
    }

    const numericAmount = Number.parseFloat(rawAmount.replaceAll(RE_NON_NUMERIC, ''));
    if (Number.isNaN(numericAmount)) {
      continue;
    }

    let amountCents = Math.round(Math.abs(numericAmount) * 100);

    // Determine sign from type column or from amount sign
    let isExpense = numericAmount < 0;
    if (rawType) {
      const t = rawType.toLowerCase();
      isExpense = t.includes('expense') || t.includes('debit') || t.includes('dr');
    }

    if (isExpense) {
      amountCents = -amountCents;
    }

    parsed.push({
      date: normalizeDate(rawDate),
      amount: amountCents,
      note: rawNote,
    });
  }

  return parsed;
}

function normalizeDate(raw: string): string {
  // Handle MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  const cleaned = raw.trim();

  if (RE_ISO_DATE.test(cleaned)) {
    return cleaned;
  }

  const slashMatch = cleaned.match(RE_SLASH_DATE);
  if (slashMatch) {
    const [, a, b, y] = slashMatch;
    const year = y.length === 2 ? `20${y}` : y;
    // Assume MM/DD/YYYY
    return `${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
  }

  return cleaned;
}
