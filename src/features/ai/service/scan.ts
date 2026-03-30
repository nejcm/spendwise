import type { AiProviderType } from '../types';
import type { Category } from '@/features/categories/types';
import type { CurrencyKey } from '@/features/currencies';
import { scanReceiptAnthropic } from './anthropic';
import { scanReceiptOpenAI } from './openai';

export type ScannedReceipt = {
  /** Total amount in the smallest currency unit (cents/pence/etc.) */
  amount: number;
  currency: CurrencyKey;
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  /** Merchant name or short description */
  note: string | null;
  type: 'expense' | 'income';
  /** Matched category id from the provided list, or null if no match */
  category_id: string | null;
};

function buildPrompt(categories: Pick<Category, 'id' | 'name'>[]): string {
  const categoryList = categories
    .map((c) => `  - id: "${c.id}", name: "${c.name}"`)
    .join('\n');

  return `You are a receipt scanner. Extract transaction details from this receipt image and return ONLY valid JSON with no markdown, no code blocks, no extra text.

Required JSON fields:
- "amount": integer, the total amount in cents (e.g. $12.50 → 1250)
- "currency": string, ISO 4217 code (e.g. "EUR", "USD"). Default to "EUR" if unclear.
- "date": string, ISO date "YYYY-MM-DD". Default to today if unclear.
- "note": string or null, the merchant name or a short description of the purchase.
- "type": "expense" or "income". Almost always "expense" for receipts.
- "category_id": string or null, pick the best matching id from the list below, or null if none fits.

Available categories:
${categoryList || '  (none)'}

Respond with ONLY the JSON object, nothing else.`;
}

const MARKDOWN_FENCES = /^```[a-z]*\n?/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const CODE_REGEX = /\n?```$/;

function parseScannedReceipt(raw: string): ScannedReceipt {
  let parsed: unknown;
  try {
    const cleaned = raw.replace(MARKDOWN_FENCES, '').replace(CODE_REGEX, '').trim();
    parsed = JSON.parse(cleaned);
  }
  catch {
    throw new Error('Could not parse AI response as JSON');
  }

  const obj = parsed as Record<string, unknown>;

  const amount = typeof obj.amount === 'number' ? Math.round(obj.amount) : null;
  if (!amount || amount <= 0) throw new Error('No valid amount found in receipt');

  const currency = typeof obj.currency === 'string' ? (obj.currency as CurrencyKey) : 'EUR';
  const date = typeof obj.date === 'string' && DATE_REGEX.test(obj.date)
    ? obj.date
    : new Date().toISOString().slice(0, 10);
  const note = typeof obj.note === 'string' ? obj.note : null;
  const type = obj.type === 'income' ? ('income' as const) : ('expense' as const);
  const category_id = typeof obj.category_id === 'string' ? obj.category_id : null;

  return { amount, currency, date, note, type, category_id };
}

// eslint-disable-next-line max-params
export async function scanReceiptImage(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png',
  categories: Pick<Category, 'id' | 'name'>[],
  provider: AiProviderType,
  apiKey: string,
): Promise<ScannedReceipt> {
  const prompt = buildPrompt(categories);
  const raw = provider === 'anthropic'
    ? await scanReceiptAnthropic(base64Image, mimeType, prompt, apiKey)
    : await scanReceiptOpenAI(base64Image, mimeType, prompt, apiKey);
  return parseScannedReceipt(raw);
}
