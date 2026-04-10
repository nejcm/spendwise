import type { TransactionType } from '../../transactions/types';
import type { Category } from '@/features/categories/types';
import type { CurrencyKey } from '@/features/currencies';
import * as z from 'zod';
import { CURRENCY_VALUES } from '@/features/currencies';
import { todayISO } from '@/features/formatting/helpers';
import { useAppStore } from '@/lib/store';
import { scanReceiptAnthropic } from './anthropic';
import { scanReceiptOpenAI } from './openai';

export const scannedReceiptSchema = z.object({
  /** Total amount in smallest currency unit (cents). Required — no fallback. */
  amount: z.number().positive().transform(Math.round),
  currency: z.enum(CURRENCY_VALUES as CurrencyKey[]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).catch(() => todayISO()),
  note: z.string().nullable().catch(null),
  type: z.enum(['expense', 'income'] as TransactionType[]).catch('expense'),
  /** Matched from provided category list, or null if no match. */
  category_id: z.string().optional().catch(undefined),
});

export type ScannedReceipt = z.infer<typeof scannedReceiptSchema>;

// Prompt
function buildPrompt(categories: Pick<Category, 'id' | 'name'>[], currency: CurrencyKey): string {
  const categoryList = categories
    .map((c) => `  - id: "${c.id}", name: "${c.name}"`)
    .join('\n');

  return `You are a receipt scanner. Extract transaction details from this receipt image and return ONLY valid JSON with no markdown, no code blocks, no extra text.

Required JSON fields:
- "amount": integer, the total amount in cents (e.g. $12.50 → 1250)
- "currency": string, ISO 4217 code (e.g. "EUR", "USD"). Infer from symbols (€ £ $ ¥ etc.), printed ISO/code, or merchant location. Default to "${currency}" if unclear.
- "date": string, ISO date "YYYY-MM-DD". Default to today if unclear.
- "note": string or null, the merchant name or a short description of the purchase.
- "type": "expense" or "income". Almost always "expense" for receipts.
- "category_id": string or null, pick the best matching id from the list below, or null if none fits.

Available categories:
${categoryList || '  (none)'}

Respond with ONLY the JSON object, nothing else.`;
}

// Parsing
const MARKDOWN_FENCES = /^```[a-z]*\n?/i;
const CODE_FENCE_END = /\n?```$/;

function parseScannedReceipt(raw: string, currency: CurrencyKey): ScannedReceipt {
  let parsed: unknown;
  try {
    const cleaned = raw.replace(MARKDOWN_FENCES, '').replace(CODE_FENCE_END, '').trim();
    parsed = JSON.parse(cleaned);
  }
  catch {
    throw new Error('Could not parse AI response as JSON');
  }

  const result = scannedReceiptSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('No valid amount found in receipt');
  }
  // currency fallback
  if (!result.data.currency) {
    result.data.currency = currency;
  }
  return result.data;
}

// Public API
export async function scanReceiptImage(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png',
  categories: Pick<Category, 'id' | 'name'>[],
): Promise<ScannedReceipt> {
  const { aiProvider, anthropicApiKey, openaiApiKey, currency } = useAppStore.getState();
  const key = aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey;
  if (!key) throw new Error('No API key configured');
  const prompt = buildPrompt(categories, currency);
  const raw = aiProvider === 'anthropic'
    ? await scanReceiptAnthropic(base64Image, mimeType, prompt, key)
    : await scanReceiptOpenAI(base64Image, mimeType, prompt, key);
  return parseScannedReceipt(raw, currency);
}
