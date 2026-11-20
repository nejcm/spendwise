import { clearAppStore, setAiProvider, setAnthropicApiKey, setCurrency, setOpenaiApiKey } from '@/lib/store/store';
import { scanReceiptAnthropic } from './anthropic';
import { scanReceiptOpenAI } from './openai';
import { scanReceiptImage, scanReceiptText } from './scan';

jest.mock('./openai', () => ({ scanReceiptOpenAI: jest.fn() }));
jest.mock('./anthropic', () => ({ scanReceiptAnthropic: jest.fn() }));

const scanMock = scanReceiptOpenAI as jest.MockedFunction<typeof scanReceiptOpenAI>;
const anthropicMock = scanReceiptAnthropic as jest.MockedFunction<typeof scanReceiptAnthropic>;
const CATEGORIES = [{ id: 'cat_food', name: 'Groceries' }];

describe('scanReceiptImage', () => {
  beforeEach(() => {
    clearAppStore();
    setCurrency('EUR');
    setOpenaiApiKey('sk-test');
    scanMock.mockReset();
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 4, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends nothing without an API key', async () => {
    setOpenaiApiKey(undefined);

    await expect(scanReceiptImage('b64', 'image/jpeg', CATEGORIES)).rejects.toThrow('No API key');
    expect(scanMock).not.toHaveBeenCalled();
  });

  it('parses fenced JSON, rounds the amount to whole cents and fills defaults', async () => {
    scanMock.mockResolvedValue('```json\n{"amount": 1249.6, "merchant_name": "Lidl", "date": "12/03/2026", "type": "refund", "category_id": "cat_food"}\n```');

    expect(await scanReceiptImage('b64', 'image/jpeg', CATEGORIES)).toEqual({
      amount: 1250,
      currency: 'EUR',
      date: '2026-11-04',
      merchant_name: 'Lidl',
      location: null,
      note: null,
      type: 'expense',
      category_id: 'cat_food',
    });
  });

  it('keeps a currency the receipt names', async () => {
    scanMock.mockResolvedValue('{"amount": 500, "currency": "USD", "date": "2026-10-30"}');

    expect(await scanReceiptImage('b64', 'image/png', CATEGORIES)).toMatchObject({ amount: 500, currency: 'USD', date: '2026-10-30' });
  });

  it.each([
    ['lowercase', 'usd', 'USD'],
    ['unsupported', 'XYZ', 'EUR'],
  ])('reads a %s currency code instead of rejecting the receipt', async (_case: string, currency: string, expected: string) => {
    scanMock.mockResolvedValue(`{"amount": 500, "currency": "${currency}"}`);

    expect(await scanReceiptImage('b64', 'image/png', CATEGORIES)).toMatchObject({ amount: 500, currency: expected });
  });

  it.each([
    ['prose', 'Sorry, I cannot read this receipt.', 'Could not parse'],
    ['missing amount', '{"merchant_name": "Lidl"}', 'No valid amount'],
    ['zero amount', '{"amount": 0}', 'No valid amount'],
    ['negative amount', '{"amount": -1250}', 'No valid amount'],
    ['amount as text', '{"amount": "12.50"}', 'No valid amount'],
  ])('rejects %s', async (_case: string, raw: string, message: string) => {
    scanMock.mockResolvedValue(raw);

    await expect(scanReceiptImage('b64', 'image/jpeg', CATEGORIES)).rejects.toThrow(message);
  });
});

describe('scanReceiptText', () => {
  beforeEach(() => {
    clearAppStore();
    setCurrency('EUR');
    setOpenaiApiKey('sk-test');
    scanMock.mockReset();
    anthropicMock.mockReset();
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 4, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends nothing without an API key', async () => {
    setOpenaiApiKey(undefined);

    await expect(scanReceiptText('Paid €12.50', CATEGORIES)).rejects.toThrow('No API key');
    expect(scanMock).not.toHaveBeenCalled();
  });

  it('sends the text inside the prompt without an image and parses the reply like a receipt', async () => {
    scanMock.mockResolvedValue('{"amount": 1250, "merchant_name": "Lidl", "category_id": "cat_food"}');

    expect(await scanReceiptText('Card payment €12.50 at Lidl', CATEGORIES)).toEqual({
      amount: 1250,
      currency: 'EUR',
      date: '2026-11-04',
      merchant_name: 'Lidl',
      location: null,
      note: null,
      type: 'expense',
      category_id: 'cat_food',
    });
    const [prompt, key, image] = scanMock.mock.calls[0]!;
    expect(prompt).toContain('Card payment €12.50 at Lidl');
    expect(prompt).toContain('id: "cat_food", name: "Groceries"');
    expect(key).toBe('sk-test');
    expect(image).toBeUndefined();
  });

  it('caps very long text', async () => {
    scanMock.mockResolvedValue('{"amount": 100}');

    await scanReceiptText(`${'a'.repeat(5000)}TAIL`, CATEGORIES);

    expect(scanMock.mock.calls[0]![0]).not.toContain('TAIL');
  });

  it('uses the selected provider and its key', async () => {
    setAiProvider('anthropic');
    setAnthropicApiKey('sk-ant');
    anthropicMock.mockResolvedValue('{"amount": 300}');

    expect(await scanReceiptText('Paid 3 EUR', CATEGORIES)).toMatchObject({ amount: 300 });
    expect(anthropicMock).toHaveBeenCalledWith(expect.stringContaining('Paid 3 EUR'), 'sk-ant', undefined);
    expect(scanMock).not.toHaveBeenCalled();
  });

  it('rejects a reply without an amount', async () => {
    scanMock.mockResolvedValue('{"merchant_name": "Lidl"}');

    await expect(scanReceiptText('hello', CATEGORIES)).rejects.toThrow('No valid amount');
  });
});
