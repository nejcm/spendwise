import {
  buildMirrorUrls,
  dateTagsForHistorical,
  fawazahmed0Provider,
  isWithinLastDays,
} from './fawazahmed0';

type MockResponseInit = {
  status: number;
  ok?: boolean;
  body?: unknown;
};

type FetchMock = jest.MockedFunction<typeof fetch>;

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
    const fetchMock = globalThis.fetch as FetchMock;
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ status: 404 }))
      .mockResolvedValueOnce(createMockResponse({
        status: 200,
        body: { eur: { usd: 1.1, gbp: 0.86 } },
      }));

    const result = await fawazahmed0Provider.latest();
    const urls = fetchMock.mock.calls.map(
      ([url]: [RequestInfo | URL, RequestInit?]) => String(url),
    );

    expect(result?.source).toBe('fawazahmed0');
    expect(result?.rates).toMatchObject({ EUR: 1, USD: 1.1, GBP: 0.86 });
    expect(urls[0]).toContain('cdn.jsdelivr.net');
    expect(urls[1]).toContain('currency-api.pages.dev');
  });

  it('falls back from jsDelivr to pages.dev for historical', async () => {
    const fetchMock = globalThis.fetch as FetchMock;
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ status: 404 }))
      .mockResolvedValueOnce(createMockResponse({
        status: 200,
        body: { eur: { usd: 1.09 } },
      }));

    const result = await fawazahmed0Provider.historical('2020-01-15');
    const urls = fetchMock.mock.calls.map(
      ([url]: [RequestInfo | URL, RequestInit?]) => String(url),
    );

    expect(result?.source).toBe('fawazahmed0-historical');
    expect(urls[0]).toContain('2020-01-15');
    expect(urls[0]).toContain('cdn.jsdelivr.net');
    expect(urls[1]).toContain('2020-01-15.currency-api.pages.dev');
  });
});

describe('fawazahmed0 date-tag helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Fixed UTC midnight anchor so day-boundary math is deterministic.
    jest.setSystemTime(new Date('2026-06-08T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('isWithinLastDays includes the exact boundary and excludes beyond it', () => {
    expect(isWithinLastDays('2026-06-08', 7)).toBe(true); // same day
    expect(isWithinLastDays('2026-06-01', 7)).toBe(true); // exactly 7 days prior
    expect(isWithinLastDays('2026-05-31', 7)).toBe(false); // 8 days prior
  });

  it('isWithinLastDays excludes future dates', () => {
    expect(isWithinLastDays('2026-06-09', 7)).toBe(false);
  });

  it('dateTagsForHistorical adds the "latest" tag only for recent dates', () => {
    expect(dateTagsForHistorical('2026-06-05')).toEqual(['2026-06-05', 'latest']);
    expect(dateTagsForHistorical('2020-01-15')).toEqual(['2020-01-15']);
  });

  it('buildMirrorUrls returns jsDelivr then pages.dev for a tag', () => {
    const urls = buildMirrorUrls('2020-01-15');
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2020-01-15/v1/currencies/eur.json',
    );
    expect(urls[1]).toBe('https://2020-01-15.currency-api.pages.dev/v1/currencies/eur.json');
  });
});
