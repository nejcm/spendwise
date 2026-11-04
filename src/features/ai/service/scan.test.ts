import { clearAppStore, setCurrency, setOpenaiApiKey } from '@/lib/store/store';
import { scanReceiptOpenAI } from './openai';
import { scanReceiptImage } from './scan';

jest.mock('./openai', () => ({ scanReceiptOpenAI: jest.fn() }));

const scanMock = scanReceiptOpenAI as jest.MockedFunction<typeof scanReceiptOpenAI>;
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
