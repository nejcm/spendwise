import { captureError } from '@/lib/analytics';
import { fetchRates, fetchRatesForDate } from './service';

jest.mock('@/lib/analytics', () => ({
  captureError: jest.fn(),
}));

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

describe('fetchRates', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    globalThis.fetch = jest.fn() as any;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('retries retryable failures and returns first provider result', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({ status: 503 }))
      .mockResolvedValueOnce(createMockResponse({
        status: 200,
        body: [
          { date: '2026-04-25', base: 'EUR', quote: 'USD', rate: 1.11 },
          { date: '2026-04-25', base: 'EUR', quote: 'GBP', rate: 0.85 },
        ],
      }));

    const promise = fetchRates();
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.source).toBe('frankfurter');
    expect(result.rates).toMatchObject({ EUR: 1, USD: 1.11, GBP: 0.85 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes('api.frankfurter.dev/v2/rates'))).toBe(true);
  });

  it('falls back to the next provider when first provider keeps failing', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({
        status: 200,
        body: { eur: { usd: 1.2, gbp: 0.89 } },
      }));

    const promise = fetchRates();
    await jest.runAllTimersAsync();
    const result = await promise;
    const urls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(result.source).toBe('fawazahmed0');
    expect(result.rates).toMatchObject({ EUR: 1, USD: 1.2, GBP: 0.89 });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(urls.slice(0, 3).every((url) => url.includes('api.frankfurter.dev/v2/rates'))).toBe(true);
    expect(urls[3]).toContain('cdn.jsdelivr.net');
  });

  it('does not retry non-retryable failures and immediately falls back', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ status: 400 }))
      .mockResolvedValueOnce(createMockResponse({
        status: 200,
        body: { eur: { usd: 1.3 } },
      }));

    const result = await fetchRates();
    const urls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(result.source).toBe('fawazahmed0');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(urls[0]).toContain('api.frankfurter.dev/v2/rates');
    expect(urls[1]).toContain('cdn.jsdelivr.net');
  });

  it('throws and captures error when all providers fail', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock
      .mockResolvedValue(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({ status: 429 }))
      .mockResolvedValueOnce(createMockResponse({ status: 429 }));

    const promise = fetchRates();
    const rejection = expect(promise).rejects.toThrow('All currency rate providers failed');
    await jest.runAllTimersAsync();
    const urls = fetchMock.mock.calls.map(([url]) => String(url));

    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(12);
    expect(urls.slice(0, 3).every((url) => url.includes('api.frankfurter.dev/v2/rates'))).toBe(true);
    expect(urls.slice(3, 9).every((url) => url.includes('cdn.jsdelivr.net') || url.includes('currency-api.pages.dev'))).toBe(true);
    expect(urls.slice(9).every((url) => url.includes('open.er-api.com'))).toBe(true);
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({
      failedProviders: ['frankfurter', 'fawazahmed0', 'open-er-api'],
    }));
    errorSpy.mockRestore();
  });
});

describe('fetchRatesForDate', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    globalThis.fetch = jest.fn() as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('does not call open-er-api for historical fetches', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes('open.er-api.com')) {
        throw new Error('open-er-api should not be called for historical');
      }
      if (url.includes('api.frankfurter.dev')) {
        return Promise.resolve(createMockResponse({ status: 400 }));
      }
      return Promise.resolve(createMockResponse({
        status: 200,
        body: { eur: { usd: 1.05 } },
      }));
    });

    const result = await fetchRatesForDate('2020-06-01');
    const urls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(result.source).toBe('fawazahmed0-historical');
    expect(urls.every((url) => !url.includes('open.er-api.com'))).toBe(true);
  });

  it('walks back to prior dates when the requested date has no rates', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes('api.frankfurter.dev') && url.includes('date=2026-06-03')) {
        return Promise.resolve(createMockResponse({ status: 404 }));
      }
      if (url.includes('api.frankfurter.dev') && url.includes('date=2026-06-02')) {
        return Promise.resolve(createMockResponse({
          status: 200,
          body: [{ date: '2026-06-02', base: 'EUR', quote: 'USD', rate: 1.12 }],
        }));
      }
      return Promise.resolve(createMockResponse({ status: 404 }));
    });

    const result = await fetchRatesForDate('2026-06-03');

    expect(result.rates).toMatchObject({ EUR: 1, USD: 1.12 });
    const frankfurterUrls = fetchMock.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes('api.frankfurter.dev'));
    expect(frankfurterUrls.some((url) => url.includes('date=2026-06-02'))).toBe(true);
  });

  it('skips captureError when reportToAnalytics is false', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(createMockResponse({ status: 404 }));

    await expect(
      fetchRatesForDate('2020-01-01', { reportToAnalytics: false }),
    ).rejects.toThrow('Historical currency rate providers failed for date 2020-01-01');

    expect(captureError).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
