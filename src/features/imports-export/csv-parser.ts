import type { TransactionType } from '../transactions/types';

import type { CurrencyKey } from '@/features/currencies';
import { CURRENCY_VALUES } from '@/features/currencies';
import { DEFAULT_USER_CURRENCY } from '../../config';

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
  category: number | null;
  account: number | null; // column with account name, resolved to account_id at import time
};

export type ParsedRow = {
  date: string;
  amount: number; // cents, positive = income, negative = expense
  note: string;
  currency?: CurrencyKey;
  type?: TransactionType;
  categoryName?: string; // raw name from CSV, resolved to category_id at import time
  accountName?: string; // raw name from CSV, resolved to account_id at import time
  isDuplicate?: boolean;
};

export type SkippedRow = {
  date: string;
  amount: number;
  note: string;
  rawCurrency: string;
};

export type MapRowsResult = {
  rows: ParsedRow[];
  skipped: SkippedRow[];
};

/**
 * Convert raw CSV rows to ParsedRow[] using column mapping.
 * Handles both signed amounts (negative = expense) and type columns.
 * Rows with a mapped but unrecognized currency are skipped and returned separately.
 */
export function mapRows(rows: string[][], mapping: ColumnMapping, hasHeader: boolean): MapRowsResult {
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const parsed: ParsedRow[] = [];
  const skipped: SkippedRow[] = [];

  for (const row of dataRows) {
    const rawDate = mapping.date !== null ? (row[mapping.date] ?? '') : '';
    const rawAmount = mapping.amount !== null ? (row[mapping.amount] ?? '') : '';
    const rawNote = mapping.note !== null ? (row[mapping.note] ?? '') : '';
    const rawType = mapping.type !== null ? (row[mapping.type] ?? '') : '';
    if (!rawDate || !rawAmount) continue;

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

    const rawCurrency = mapping.currency ? (row[mapping.currency] ?? '').trim().toUpperCase() : '';
    const currencyKnown = CURRENCY_VALUES.includes(rawCurrency as CurrencyKey);
    const currency = currencyKnown ? (rawCurrency as CurrencyKey) : undefined;

    // Skip rows where a currency column is mapped, a value is present, but it's not recognized
    if (!currency && rawCurrency !== '') {
      skipped.push({ date: normalizeDate(rawDate), amount: amountCents, note: rawNote, rawCurrency });
      continue;
    }

    // Category name
    const rawCategory = mapping.category !== null ? (row[mapping.category] ?? '').trim() : '';

    // Account name
    const rawAccount = mapping.account !== null ? (row[mapping.account] ?? '').trim() : '';

    parsed.push({
      date: normalizeDate(rawDate),
      amount: amountCents,
      note: rawNote,
      type,
      currency: currency ?? DEFAULT_USER_CURRENCY,
      ...(rawCategory && { categoryName: rawCategory }),
      ...(rawAccount && { accountName: rawAccount }),
    });
  }

  return { rows: parsed, skipped };
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
  const mapping: ColumnMapping = { amount: null, date: null, note: null, type: null, currency: null, category: null, account: null };

  if (!headers) return mapping;

  headers.forEach((header, index) => {
    const lower = header.trim().toLowerCase();

    if (mapping.date === null && (lower.includes('date'))) {
      mapping.date = index;
      return;
    }

    if (
      mapping.amount === null
      && (lower.includes('amount') || lower.includes('value') || lower.includes('sum'))
    ) {
      mapping.amount = index;
      return;
    }

    if (
      mapping.note === null
      && (lower.includes('note')
        || lower.includes('memo')
        || lower.includes('description')
        || lower.includes('details'))
    ) {
      mapping.note = index;
      return;
    }

    if (
      mapping.type === null
      && (lower.includes('type')
        || lower.includes('credit')
        || lower.includes('debit')
        || lower.includes('dr/cr'))
    ) {
      mapping.type = index;
      return;
    }

    if (
      mapping.category === null
      && lower.includes('category')
    ) {
      mapping.category = index;
      return;
    }

    if (
      mapping.currency === null
      && (lower.includes('currency') || lower.includes('curr'))
    ) {
      mapping.currency = index;
      return;
    }

    if (mapping.account === null && lower.includes('account')) {
      mapping.account = index;
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
