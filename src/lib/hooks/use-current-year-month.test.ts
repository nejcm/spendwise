import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { setMonthStartDay } from '@/lib/store/store';
import { act, renderHook } from '@/lib/test-utils';
import { useCurrentDay, useCurrentYearMonth } from './use-current-year-month';

let mockFocusListener: (() => void) | undefined;
const mockUnsubscribeFocus = jest.fn();
const mockNavigation = {
  addListener: (_event: 'focus', listener: () => void) => {
    mockFocusListener = listener;
    return mockUnsubscribeFocus;
  },
};

jest.mock('expo-router', () => ({
  useNavigation: () => mockNavigation,
}));

describe('useCurrentYearMonth', () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined;
  const remove = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 31, 23, 50));
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateListener = listener as (state: AppStateStatus) => void;
      return { remove };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('updates when the app becomes active in a new month', () => {
    const { result } = renderHook(() => useCurrentYearMonth());
    expect(result.current).toBe('2026-10');

    jest.setSystemTime(new Date(2026, 10, 1, 8, 0));
    act(() => appStateListener?.('background'));
    expect(result.current).toBe('2026-10');

    act(() => appStateListener?.('active'));
    expect(result.current).toBe('2026-11');
  });

  it('updates on screen focus in a new month', () => {
    const { result } = renderHook(() => useCurrentYearMonth());

    jest.setSystemTime(new Date(2026, 10, 1, 8, 0));
    act(() => mockFocusListener?.());
    expect(result.current).toBe('2026-11');
  });

  it('updates at the local month boundary while in the foreground, and keeps re-arming', () => {
    const { result } = renderHook(() => useCurrentYearMonth());

    act(() => jest.advanceTimersByTime(9 * 60_000));
    expect(result.current).toBe('2026-10');
    act(() => jest.advanceTimersByTime(60_000));
    expect(result.current).toBe('2026-11');

    act(() => jest.advanceTimersByTime(31 * 24 * 60 * 60_000));
    expect(result.current).toBe('2026-12');
  });

  it('follows the month start day and re-keys when it changes', () => {
    const { result } = renderHook(() => useCurrentYearMonth());
    expect(result.current).toBe('2026-10');

    act(() => setMonthStartDay(25));
    try {
      expect(result.current).toBe('2026-10');
      act(() => jest.advanceTimersByTime(24 * 24 * 60 * 60_000));
      expect(result.current).toBe('2026-10');
      act(() => jest.advanceTimersByTime(2 * 60 * 60_000));
      expect(result.current).toBe('2026-11');
    }
    finally {
      act(() => setMonthStartDay(1));
    }
  });

  it('removes both listeners and the boundary timer on unmount', () => {
    const { unmount } = renderHook(() => useCurrentYearMonth());
    unmount();
    expect(remove).toHaveBeenCalled();
    expect(mockUnsubscribeFocus).toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('useCurrentDay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 30, 23, 50));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates at local midnight while in the foreground, and keeps re-arming', () => {
    const { result } = renderHook(() => useCurrentDay());
    expect(result.current).toBe('2026-06-30');

    act(() => jest.advanceTimersByTime(10 * 60_000));
    expect(result.current).toBe('2026-07-01');

    act(() => jest.advanceTimersByTime(24 * 60 * 60_000));
    expect(result.current).toBe('2026-07-02');
  });
});
