import type { PeriodSelection } from '@/lib/store/store';
import { addDays, format, startOfDay } from 'date-fns';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { currentYearMonth, getPeriodRange, monthRangeOf, unixToCalendarDate } from '@/lib/date/helpers';
import { useAppStore } from '@/lib/store/store';

// Longer delays overflow setTimeout's 32-bit int and fire immediately.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
const nextMonth = (now: Date) => unixToCalendarDate(monthRangeOf(now)[1]);
const nextDay = (now: Date) => addDays(startOfDay(now), 1);
const today = () => format(new Date(), 'yyyy-MM-dd');

function useCurrentDateKey(currentKey: () => string, nextBoundary: (now: Date) => Date, monthStartDay?: number) {
  const navigation = useNavigation();
  const [key, setKey] = useState(currentKey);
  const [keyedDay, setKeyedDay] = useState(monthStartDay);
  if (keyedDay !== monthStartDay) {
    setKeyedDay(monthStartDay);
    setKey(currentKey());
  }

  useEffect(() => {
    const refresh = () => setKey(currentKey());
    let timer: ReturnType<typeof setTimeout>;
    const armBoundaryTimer = () => {
      const now = new Date();
      timer = setTimeout(() => {
        refresh();
        armBoundaryTimer();
      }, Math.min(nextBoundary(now).getTime() - now.getTime(), MAX_TIMEOUT_MS));
    };
    armBoundaryTimer();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const unsubscribeFocus = navigation.addListener('focus', refresh);
    return () => {
      clearTimeout(timer);
      appState.remove();
      unsubscribeFocus();
    };
  }, [navigation, currentKey, nextBoundary, monthStartDay]);

  return key;
}

/** `yyyy-MM` of the month holding today (per the month start day), refreshed at the month boundary, on foreground, on screen focus and when the start day changes. */
export const useCurrentYearMonth = () => useCurrentDateKey(currentYearMonth, nextMonth, useAppStore.use.monthStartDay());

/** Local `yyyy-MM-dd` of today, refreshed at midnight, on foreground and on screen focus. */
export const useCurrentDay = () => useCurrentDateKey(today, nextDay);

/** The Period's [start, end), re-derived at a date rollover and when the month start day changes. */
export function usePeriodRange(selection: PeriodSelection) {
  useCurrentDay();
  useAppStore.use.monthStartDay();
  return getPeriodRange(selection);
}
