import type { CurrencyKey } from '../features/currencies';
import type { Account } from '@/features/accounts/types';
import type { CurrencyFormat, DateFormat, NumberFormat } from '@/features/formatting/constants';
import type { Language } from '@/features/languages/types';
import type { ThemeType } from '@/features/settings/theme';
import type { Transaction } from '@/features/transactions/types';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { currentPeriodSelection } from '@/lib/date/helpers';
import { createSelectors } from '@/lib/utils';
import { DEFAULT_DATE_FORMAT, DEFAULT_USER_CURRENCY } from '../config';
import { mmkvStorage } from './storage';

export type TokenType = {
  access: string;
  refresh: string;
};

export type ColorThemeType = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'white';

export type PeriodMode = 'year' | 'month' | 'week' | 'custom';

export type PeriodSelectionYear = { mode: 'year'; year: number };
export type PeriodSelectionMonth = { mode: 'month'; year: number; month: number };
export type PeriodSelectionWeek = { mode: 'week'; year: number; week: number };
export type PeriodSelectionCustom = { mode: 'custom'; startDate: string; endDate: string };
export type PeriodSelection = PeriodSelectionYear | PeriodSelectionMonth | PeriodSelectionWeek | PeriodSelectionCustom;

export type AppState = {
// Profile
  profile: {
    name: string;
    avatar: number;
  };

  // Auth
  token: TokenType | null;
  authStatus: 'idle' | 'signOut' | 'signIn';

  // Preferences
  currency: CurrencyKey;
  currencyFormat: CurrencyFormat;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  monthStartDay: number;
  theme: ThemeType;
  colorTheme: ColorThemeType;
  isFirstTime: boolean;
  language: Language | undefined;
  notifications: {
    global?: boolean;
  };

  // Security
  lockEnabled: boolean;
  lockTimeoutMinutes: number;
  isLocked: boolean; // runtime only — not persisted

  // AI
  aiProvider: 'openai' | 'anthropic';
  openaiApiKey: string | undefined;
  anthropicApiKey: string | undefined;

  // Other
  lastUsed: {
    currencies: CurrencyKey[];
  };

  // Form preferences
  formPrefs: {
    transactionForm: Partial<Pick<Transaction, 'type' | 'currency' | 'category_id' | 'account_id'>>;
    accountForm: Partial<Pick<Account, 'type' | 'currency'>>;
  };

  // UI state (not persisted)
  periodSelection: PeriodSelection;
};

function getDefaultState(): AppState {
  return {
    profile: {
      name: '',
      avatar: 1,
    },
    token: null,
    authStatus: 'idle',
    currency: DEFAULT_USER_CURRENCY,
    currencyFormat: 'symbol-after',
    dateFormat: DEFAULT_DATE_FORMAT,
    numberFormat: 'stop',
    monthStartDay: 1,
    theme: 'system',
    colorTheme: 'red',
    isFirstTime: true,
    language: undefined,
    lockEnabled: false,
    lockTimeoutMinutes: 1,
    isLocked: false,

    aiProvider: 'openai',
    openaiApiKey: undefined,
    anthropicApiKey: undefined,

    notifications: {
    },
    lastUsed: {
      currencies: [DEFAULT_USER_CURRENCY],
    },
    formPrefs: {
      transactionForm: {},
      accountForm: {},
    },
    periodSelection: currentPeriodSelection(),
  };
}

const _useAppStore = create<AppState>()(
  persist(
    (_set) => (getDefaultState()),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ isLocked: _, periodSelection: __, ...rest }) => rest as AppState,
    },
  ),
);

export const useAppStore = createSelectors(_useAppStore);

export function clearAppStore() {
  return _useAppStore.setState(getDefaultState());
}

// Selectors
export const getAppState = () => _useAppStore.getState();

// Profile actions
export function setProfile(profile: AppState['profile']) {
  return _useAppStore.setState((prev) => ({ ...prev, profile }));
}
export function updateProfile(profile: Partial<AppState['profile']>) {
  return _useAppStore.setState((prev) => ({
    ...prev,
    profile: { ...prev.profile, ...profile },
  }));
}
export const selectProfile = (state: AppState) => state.profile;

// Auth actions
export function signIn(token: TokenType) {
  return _useAppStore.setState((prev) => ({ ...prev, token, authStatus: 'signIn' }));
}

export function signOut() {
  return _useAppStore.setState((prev) => ({ ...prev, token: null, authStatus: 'signOut' }));
}

export function hydrateAuth() {
  const { token } = _useAppStore.getState();
  if (token !== null) signIn(token);
  else signOut();
}

// Preference actions
export function setCurrency(currency: CurrencyKey) {
  return _useAppStore.setState((prev) => ({ ...prev, currency: currency.length > 0 ? currency : DEFAULT_USER_CURRENCY }));
}

export function setCurrencyFormat(currencyFormat: AppState['currencyFormat']) {
  return _useAppStore.setState((prev) => ({ ...prev, currencyFormat }));
}

export function setDateFormat(dateFormat: AppState['dateFormat']) {
  return _useAppStore.setState((prev) => ({ ...prev, dateFormat }));
}

export function setNumberFormat(numberFormat: AppState['numberFormat']) {
  return _useAppStore.setState((prev) => ({ ...prev, numberFormat }));
}

export function setMonthStartDay(monthStartDay: number) {
  return _useAppStore.setState((prev) => ({ ...prev, monthStartDay }));
}

export function setTheme(theme: ThemeType) {
  return _useAppStore.setState((prev) => ({ ...prev, theme }));
}

export function setIsFirstTime(isFirstTime: boolean) {
  return _useAppStore.setState((prev) => ({ ...prev, isFirstTime }));
}

export function setLanguage(language: Language) {
  return _useAppStore.setState((prev) => ({ ...prev, language }));
}

// AI actions
export function setAiProvider(aiProvider: AppState['aiProvider']) {
  return _useAppStore.setState((prev) => ({ ...prev, aiProvider }));
}

export function setOpenaiApiKey(openaiApiKey: string) {
  return _useAppStore.setState((prev) => ({ ...prev, openaiApiKey }));
}

export function setAnthropicApiKey(anthropicApiKey: string) {
  return _useAppStore.setState((prev) => ({ ...prev, anthropicApiKey }));
}

// Security actions
export function setLockEnabled(lockEnabled: boolean) {
  return _useAppStore.setState((prev) => ({ ...prev, lockEnabled }));
}

export function setIsLocked(isLocked: boolean) {
  return _useAppStore.setState((prev) => ({ ...prev, isLocked }));
}

export function setLockTimeoutMinutes(lockTimeoutMinutes: number) {
  return _useAppStore.setState((prev) => ({ ...prev, lockTimeoutMinutes }));
}

// Period selection actions
export function setPeriodSelection(periodSelection: PeriodSelection) {
  return _useAppStore.setState((prev) => ({ ...prev, periodSelection }));
}

// Other actions
export function setLastUsed(lastUsed: AppState['lastUsed']) {
  return _useAppStore.setState((prev) => ({ ...prev, lastUsed }));
}
export function updateLastUsed(lastUsed: Partial<AppState['lastUsed']>) {
  return _useAppStore.setState((state) => ({
    ...state,
    lastUsed: { ...state.lastUsed, ...lastUsed },
  }));
}
export const selectLastUsed = (state: AppState) => state.lastUsed;

export function addLastUsedCurrency(currency: CurrencyKey) {
  return _useAppStore.setState((prev) => {
    const existing = prev.lastUsed.currencies ?? [];
    const deduped = [currency, ...existing.filter((c) => c !== currency)].slice(0, 5);
    return {
      ...prev,
      lastUsed: {
        ...prev.lastUsed,
        currencies: deduped,
      },
    };
  });
}
export function selectLastUsedCurrencies(state: AppState) {
  return state.lastUsed.currencies.length
    ? state.lastUsed.currencies
    : state.currency ? [state.currency] : undefined;
}

// Form preference actions
function updateFormPrefs(prefs: Partial<AppState['formPrefs']>) {
  return _useAppStore.setState((prev) => ({
    ...prev,
    formPrefs: {
      ...prev.formPrefs,
      ...prefs,
    },
  }));
}
export function setTransactionFormPrefs(prefs: AppState['formPrefs']['transactionForm']) {
  return updateFormPrefs({ transactionForm: prefs });
}

export function setAccountFormPrefs(prefs: AppState['formPrefs']['accountForm']) {
  return updateFormPrefs({ accountForm: prefs });
}
export const selectTransactionFormPrefs = (state: AppState) => state.formPrefs.transactionForm;
export const selectAccountFormPrefs = (state: AppState) => state.formPrefs.accountForm;

// Notifications actions
export function updateNotifications(notifications: Partial<AppState['notifications']>) {
  return _useAppStore.setState((prev) => ({ ...prev, notifications: { ...prev.notifications, ...notifications } }));
}
export const selectNotifications = (state: AppState) => state.notifications;
