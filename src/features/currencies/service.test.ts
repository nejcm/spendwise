import { captureError } from '@/lib/analytics';
import { fetchRates } from './service';

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
        body: { rates: { USD: 1.11, GBP: 0.85 } },
      }));

    const promise = fetchRates();
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.source).toBe('frankfurter');
    expect(result.rates).toMatchObject({ EUR: 1, USD: 1.11, GBP: 0.85 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes('api.frankfurter.app/latest'))).toBe(true);
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
    expect(urls.slice(0, 3).every((url) => url.includes('api.frankfurter.app/latest'))).toBe(true);
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
    expect(urls[0]).toContain('api.frankfurter.app/latest');
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
    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(urls.slice(0, 3).every((url) => url.includes('api.frankfurter.app/latest'))).toBe(true);
    expect(urls.slice(3, 6).every((url) => url.includes('cdn.jsdelivr.net'))).toBe(true);
    expect(urls.slice(6).every((url) => url.includes('open.er-api.com'))).toBe(true);
    expect(captureError).toHaveBeenCalledWith(expect.any(Error));
    errorSpy.mockRestore();
  });
});
