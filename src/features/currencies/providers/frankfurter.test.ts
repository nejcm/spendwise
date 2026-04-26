import { frankfurterProvider } from './frankfurter';

type MockResponseInit = {
  status: number;
  ok?: boolean;
  body?: unknown;
};

function createMockResponse({ status, ok = status >= 200 && status < 300, body }: MockResponseInit): Response {
  return {
    status,
    ok,
    json: async () => body,
  } as Response;
}

describe('frankfurterProvider', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('fetches latest rates from the v2 endpoint', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(createMockResponse({
      status: 200,
      body: [
        { date: '2026-04-25', base: 'EUR', quote: 'USD', rate: 1.13 },
        { date: '2026-04-25', base: 'EUR', quote: 'GBP', rate: 0.86 },
      ],
    }));

    const result = await frankfurterProvider.latest();
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));

    expect(result).toEqual({
      rates: expect.objectContaining({ EUR: 1, USD: 1.13, GBP: 0.86 }),
      source: 'frankfurter',
    });
    expect(`${url.origin}${url.pathname}`).toBe('https://api.frankfurter.dev/v2/rates');
    expect(url.searchParams.get('base')).toBe('EUR');
    expect(url.searchParams.get('quotes')).toContain('USD');
  });

  it('fetches historical rates with the v2 date parameter', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(createMockResponse({
      status: 200,
      body: [
        { date: '2026-04-01', base: 'EUR', quote: 'USD', rate: 1.09 },
      ],
    }));

    const result = await frankfurterProvider.historical('2026-04-01');
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));

    expect(result).toEqual({
      rates: expect.objectContaining({ EUR: 1, USD: 1.09 }),
      source: 'frankfurter-historical',
    });
    expect(url.searchParams.get('date')).toBe('2026-04-01');
    expect(url.searchParams.get('base')).toBe('EUR');
  });

  it('groups v2 range rows by date', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(createMockResponse({
      status: 200,
      body: [
        { date: '2026-04-01', base: 'EUR', quote: 'USD', rate: 1.09 },
        { date: '2026-04-01', base: 'EUR', quote: 'GBP', rate: 0.85 },
        { date: '2026-04-02', base: 'EUR', quote: 'USD', rate: 1.1 },
      ],
    }));

    const result = await frankfurterProvider.range('2026-04-01', '2026-04-02');
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));

    expect(result).toEqual({
      ratesByDate: {
        '2026-04-01': expect.objectContaining({ EUR: 1, USD: 1.09, GBP: 0.85 }),
        '2026-04-02': expect.objectContaining({ EUR: 1, USD: 1.1 }),
      },
      source: 'frankfurter-range',
    });
    expect(url.searchParams.get('from')).toBe('2026-04-01');
    expect(url.searchParams.get('to')).toBe('2026-04-02');
    expect(url.searchParams.get('base')).toBe('EUR');
  });
});
