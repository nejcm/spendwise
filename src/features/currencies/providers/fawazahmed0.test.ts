import { fawazahmed0Provider } from './fawazahmed0';

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

describe('fawazahmed0Provider', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('falls back from jsDelivr to pages.dev for latest', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ status: 404 }))
      .mockResolvedValueOnce(createMockResponse({
        status: 200,
        body: { eur: { usd: 1.1, gbp: 0.86 } },
      }));

    const result = await fawazahmed0Provider.latest();
    const urls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(result?.source).toBe('fawazahmed0');
    expect(result?.rates).toMatchObject({ EUR: 1, USD: 1.1, GBP: 0.86 });
    expect(urls[0]).toContain('cdn.jsdelivr.net');
    expect(urls[1]).toContain('currency-api.pages.dev');
  });

  it('falls back from jsDelivr to pages.dev for historical', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ status: 404 }))
      .mockResolvedValueOnce(createMockResponse({
        status: 200,
        body: { eur: { usd: 1.09 } },
      }));

    const result = await fawazahmed0Provider.historical('2020-01-15');
    const urls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(result?.source).toBe('fawazahmed0-historical');
    expect(urls[0]).toContain('2020-01-15');
    expect(urls[0]).toContain('cdn.jsdelivr.net');
    expect(urls[1]).toContain('2020-01-15.currency-api.pages.dev');
  });
});
