import { UTCDate } from '@date-fns/utc';
import { eachDayOfInterval } from 'date-fns';

import {
  fetchRatesWithBackoff,
  fetchWithTimeout,
  priorCalendarDates,
  RANGE_HISTORICAL_MAX_FETCHES,
  subsampleOrderedToMaxCount,
} from './utils';

/** Same expansion as `fawazahmed0` range fetches: inclusive UTC calendar days → `YYYY-MM-DD`. */
function isoDatesInRange(startDate: string, endDate: string): string[] {
  const start = new UTCDate(`${startDate}T00:00:00Z`);
  const end = new UTCDate(`${endDate}T00:00:00Z`);
  return eachDayOfInterval({ start, end }).map((d) => d.toISOString().slice(0, 10));
}

describe('priorCalendarDates', () => {
  it('returns anchor date then prior calendar days', () => {
    expect(priorCalendarDates('2026-06-03', 2)).toEqual([
      '2026-06-03',
      '2026-06-02',
      '2026-06-01',
    ]);
  });
});

describe('fetchWithTimeout', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('aborts the in-flight request and leaves no dangling timer on timeout', async () => {
    let receivedSignal: AbortSignal | undefined;
    globalThis.fetch = jest.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      receivedSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    }) as typeof fetch;

    const promise = fetchWithTimeout('https://example.test/rates', 5_000);
    const rejection = expect(promise).rejects.toThrow();
    await jest.advanceTimersByTimeAsync(5_000);
    await rejection;

    expect(receivedSignal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('clears the timeout once the request resolves in time', async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, status: 200 } as Response),
    ) as typeof fetch;

    const result = await fetchWithTimeout('https://example.test/rates', 5_000);

    expect(result.status).toBe(200);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('fetchRatesWithBackoff', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries with backoff when a bounded request rejects, then succeeds', async () => {
    let calls = 0;
    const promise = fetchRatesWithBackoff(
      () => {
        calls += 1;
        if (calls === 1) {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          return Promise.reject(err);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        } as Response);
      },
      (data) => ((data as { ok?: boolean }).ok ? { source: 'test' } : null),
    );

    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ source: 'test' });
    expect(calls).toBe(2);
  });
});

describe('subsampleOrderedToMaxCount', () => {
  it('returns empty for empty items or maxCount < 1', () => {
    expect(subsampleOrderedToMaxCount([], 10)).toEqual([]);
    expect(subsampleOrderedToMaxCount(['a'], 0)).toEqual([]);
    expect(subsampleOrderedToMaxCount(['a'], -1)).toEqual([]);
  });

  it('returns a copy of items when length <= maxCount', () => {
    const items = ['a', 'b', 'c'];
    const out = subsampleOrderedToMaxCount(items, 5);
    expect(out).toEqual(['a', 'b', 'c']);
    expect(out).not.toBe(items);
  });

  it('with maxCount 1 returns only the last element', () => {
    expect(subsampleOrderedToMaxCount(['x', 'y', 'z'], 1)).toEqual(['z']);
  });

  it('includes first and last when subsampling', () => {
    const items = Array.from({ length: 250 }, (_, i) => `d${i}`);
    const out = subsampleOrderedToMaxCount(items, 100);
    expect(out).toHaveLength(100);
    expect(out[0]).toBe('d0');
    expect(out[99]).toBe('d249');
  });

  it('never returns more than maxCount', () => {
    const items = Array.from({ length: 500 }, (_, i) => i);
    expect(subsampleOrderedToMaxCount(items, RANGE_HISTORICAL_MAX_FETCHES)).toHaveLength(
      RANGE_HISTORICAL_MAX_FETCHES,
    );
  });

  it('uses evenly spaced indices for 101 items and max 100', () => {
    const items = Array.from({ length: 101 }, (_, i) => i);
    const out = subsampleOrderedToMaxCount(items, 100);
    expect(out).toHaveLength(100);
    expect(out[0]).toBe(0);
    expect(out[99]).toBe(100);
  });

  it('subsamples a full-year ISO range like the fawazahmed0 range fallback', () => {
    const start = '2024-01-01';
    const end = '2024-12-31';
    const allDays = isoDatesInRange(start, end);
    expect(allDays).toHaveLength(366);

    const sampled = subsampleOrderedToMaxCount(allDays, RANGE_HISTORICAL_MAX_FETCHES);
    expect(sampled).toHaveLength(RANGE_HISTORICAL_MAX_FETCHES);
    expect(sampled[0]).toBe(start);
    expect(sampled.at(-1)).toBe(end);
    expect(sampled.length).toBeLessThanOrEqual(RANGE_HISTORICAL_MAX_FETCHES);
    for (const d of sampled) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
