const RE_NON_NUMERIC = /[^\d.-]/g;
const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
const RE_CURRENCY = /eur|usd|gbp|chf|cad|aud|[¥€$]/i;

/**
 * Minimal CSV parser - handles quoted fields and commas.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
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
    else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') {
        i++;
      }

      if (fields.length > 0 || current.trim()) {
        fields.push(current.trim());
        rows.push([...fields]);
      }

      fields.length = 0;
      current = '';
    }
    else {
      current += ch;
    }
  }

  if (fields.length > 0 || current.trim()) {
    fields.push(current.trim());
    rows.push(fields);
  }

  return rows;
}

export type ColumnMapping = {
  date: number | null;
  amount: number | null;
  currency: number | null;
  note: number | null;
  type: number | null; // column with "income"/"expense" or positive/negative
};

export type ParsedRow = {
  date: string;
  amount: number; // cents, positive = income, negative = expense
  note: string;
  type?: 'income' | 'expense' | 'transfer';
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

    // Determine sign from type column or from amount sign.
    let type: ParsedRow['type'];
    let isExpense = numericAmount < 0;
    if (rawType) {
      const t = rawType.toLowerCase();
      if (t.includes('transfer')) {
        type = 'transfer';
      }
      else {
        isExpense = t.includes('expense') || t.includes('debit') || t.includes('dr');
        type = isExpense ? 'expense' : 'income';
      }
    }
    else {
      type = isExpense ? 'expense' : 'income';
    }

    if (type === 'expense') {
      amountCents = -amountCents;
    }

    parsed.push({
      date: normalizeDate(rawDate),
      amount: amountCents,
      note: rawNote,
      type,
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

export function autoDetectColumnMapping(rows: string[][]): ColumnMapping {
  const [headers, sampleRow] = rows;
  const mapping: ColumnMapping = { amount: null, date: null, note: null, type: null, currency: null };

  if (!headers) return mapping;

  headers.forEach((header, index) => {
    const lower = header.trim().toLowerCase();

    if (mapping.date === null && (lower.includes('date') || lower.includes('datum'))) {
      mapping.date = index;
      return;
    }

    if (
      mapping.amount === null
      && (lower.includes('amount') || lower.includes('value') || lower.includes('znesek') || lower.includes('sum'))
    ) {
      mapping.amount = index;
      return;
    }

    if (
      mapping.note === null
      && (lower.includes('note')
        || lower.includes('memo')
        || lower.includes('description')
        || lower.includes('details')
        || lower.includes('opis'))
    ) {
      mapping.note = index;
      return;
    }

    if (
      mapping.type === null
      && (lower.includes('type')
        || lower.includes('category')
        || lower.includes('credit')
        || lower.includes('debit')
        || lower.includes('dr/cr'))
    ) {
      mapping.type = index;
      return;
    }

    if (
      mapping.currency === null
      && (lower.includes('currency') || lower.includes('curr') || lower.includes('valuta'))
    ) {
      mapping.currency = index;
    }
  });

  // Fallback: infer from first data row if headers weren't conclusive
  if (sampleRow) {
    sampleRow.forEach((value, index) => {
      const trimmed = value.trim();

      if (mapping.date === null && (RE_ISO_DATE.test(trimmed) || RE_SLASH_DATE.test(trimmed))) {
        mapping.date = index;
        return;
      }

      if (mapping.amount === null) {
        const numeric = Number.parseFloat(trimmed.replaceAll(RE_NON_NUMERIC, ''));
        if (!Number.isNaN(numeric)) {
          mapping.amount = index;
          return;
        }
      }

      if (mapping.type === null) {
        const lower = trimmed.toLowerCase();
        if (
          lower === 'debit'
          || lower === 'credit'
          || lower === 'dr'
          || lower === 'cr'
          || lower === 'expense'
          || lower === 'income'
        ) {
          mapping.type = index;
          return;
        }
      }

      if (mapping.currency === null) {
        if (RE_CURRENCY.test(trimmed)) {
          mapping.currency = index;
        }
      }
    });
  }

  return mapping;
}
