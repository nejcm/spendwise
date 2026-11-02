import { addDays, addMonths, format, startOfDay, startOfMonth } from 'date-fns';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Longer delays overflow setTimeout's 32-bit int and fire immediately.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
const nextMonth = (now: Date) => addMonths(startOfMonth(now), 1);
const nextDay = (now: Date) => addDays(startOfDay(now), 1);

function useCurrentDateKey(pattern: string, nextBoundary: (now: Date) => Date) {
  const navigation = useNavigation();
  const [key, setKey] = useState(() => format(new Date(), pattern));

  useEffect(() => {
    const refresh = () => setKey(format(new Date(), pattern));
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
  }, [navigation, pattern, nextBoundary]);

  return key;
}

/** Local `yyyy-MM` of the current month, refreshed at the month boundary, on foreground and on screen focus. */
export const useCurrentYearMonth = () => useCurrentDateKey('yyyy-MM', nextMonth);

/** Local `yyyy-MM-dd` of today, refreshed at midnight, on foreground and on screen focus. */
export const useCurrentDay = () => useCurrentDateKey('yyyy-MM-dd', nextDay);
