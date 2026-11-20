import type { TransactionType } from '../../transactions/types';
import type { Category } from '@/features/categories/types';
import type { CurrencyKey } from '@/features/currencies';
import * as z from 'zod';
import { CURRENCY_VALUES } from '@/features/currencies';
import { todayISO } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { selectIsAiFeatureOn, useAppStore } from '@/lib/store/store';
import { truncateText } from '@/lib/utils';
import { scanReceiptAnthropic } from './anthropic';
import { scanReceiptOpenAI } from './openai';

export type ScanImage = {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png';
};

const scannedReceiptSchema = z.object({
  /** Total amount in smallest currency unit (cents). Required — no fallback. */
  amount: z.number().positive().transform(Math.round),
  currency: z.string().toUpperCase().pipe(z.enum(CURRENCY_VALUES as CurrencyKey[])).optional().catch(undefined),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).catch(() => todayISO()),
  merchant_name: z.string().nullable().catch(null),
  location: z.string().nullable().catch(null),
  note: z.string().nullable().catch(null),
  type: z.enum(['expense', 'income'] as TransactionType[]).catch('expense'),
  /** Matched from provided category list, or null if no match. */
  category_id: z.string().optional().catch(undefined),
});

export type ScannedReceipt = z.infer<typeof scannedReceiptSchema>;

// Prompt
const MAX_SHARED_TEXT_LENGTH = 5000;

function buildPrompt(
  categories: Pick<Category, 'id' | 'name'>[],
  currency: CurrencyKey,
  sharedText?: string,
): string {
  const today = todayISO();
  const categoryList = categories
    .map((c) => `  - id: "${c.id}", name: "${c.name}"`)
    .join('\n');

  const source = sharedText === undefined
    ? 'this receipt image'
    : 'the text below (a receipt, bank or payment notification, or email)';

  const prompt = `You are a receipt scanner. Extract transaction details from ${source} and return ONLY valid JSON with no markdown, no code blocks, no extra text.

Required JSON fields:
- "amount": integer, the total amount in cents (e.g. $12.50 → 1250)
- "currency": string, ISO 4217 code (e.g. "EUR", "USD"). Infer from symbols (€ £ $ ¥ etc.), printed ISO/code, or merchant location. Default to "${currency}" if unclear.
- "date": string, ISO date "YYYY-MM-DD". Use the receipt date only if the day is explicitly visible and unambiguous. If the day is missing, partially obscured, low-confidence, or there are multiple plausible days, set "date" to "${today}"
- "merchant_name": string or null, the merchant/payee name when it is visible.
- "location": string or null, the full address or best single location string shown on the receipt.
- "note": string or null, a short description of the purchase. Do not repeat the merchant name here unless no better description is available.
- "type": "expense" or "income". Almost always "expense" for receipts.
- "category_id": string or null, pick the best matching id from the list below, or null if none fits.

Available categories:
${categoryList || '  (none)'}

Respond with ONLY the JSON object, nothing else.`;

  if (sharedText === undefined) return prompt;
  return `${prompt}\n\nText:\n"""\n${truncateText(sharedText, MAX_SHARED_TEXT_LENGTH)}\n"""`;
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

async function scanReceipt(
  categories: Pick<Category, 'id' | 'name'>[],
  input: { image: ScanImage } | { text: string },
): Promise<ScannedReceipt> {
  const state = useAppStore.getState();
  const { aiProvider, anthropicApiKey, openaiApiKey, currency } = state;
  const key = aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey;
  if (!key) throw new Error('No API key configured');
  if (!selectIsAiFeatureOn('scan')(state)) throw new Error(translate('scan.off_message'));
  const image = 'image' in input ? input.image : undefined;
  const prompt = buildPrompt(categories, currency, 'text' in input ? input.text : undefined);
  const raw = aiProvider === 'anthropic'
    ? await scanReceiptAnthropic(prompt, key, image)
    : await scanReceiptOpenAI(prompt, key, image);
  return parseScannedReceipt(raw, currency);
}

// Public API
export function scanReceiptImage(
  base64Image: string,
  mimeType: ScanImage['mimeType'],
  categories: Pick<Category, 'id' | 'name'>[],
): Promise<ScannedReceipt> {
  return scanReceipt(categories, { image: { base64: base64Image, mimeType } });
}

export function scanReceiptText(
  text: string,
  categories: Pick<Category, 'id' | 'name'>[],
): Promise<ScannedReceipt> {
  return scanReceipt(categories, { text });
}
