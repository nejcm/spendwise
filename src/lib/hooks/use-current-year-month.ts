import { addMonths, format, startOfMonth } from 'date-fns';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const currentYearMonth = () => format(new Date(), 'yyyy-MM');
// Longer delays overflow setTimeout's 32-bit int and fire immediately.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** Local `yyyy-MM` of the current month, refreshed at the month boundary, on foreground and on screen focus. */
export function useCurrentYearMonth() {
  const navigation = useNavigation();
  const [yearMonth, setYearMonth] = useState(currentYearMonth);

  useEffect(() => {
    const refresh = () => setYearMonth(currentYearMonth());
    let timer: ReturnType<typeof setTimeout>;
    const armBoundaryTimer = () => {
      const now = new Date();
      timer = setTimeout(() => {
        refresh();
        armBoundaryTimer();
      }, Math.min(addMonths(startOfMonth(now), 1).getTime() - now.getTime(), MAX_TIMEOUT_MS));
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
  }, [navigation]);

  return yearMonth;
}
