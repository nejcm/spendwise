import type { StateStorage } from 'zustand/middleware';

import type { CurrencyKey } from '../features/currencies';
import type { Account } from '@/features/accounts/types';
import type { CurrencyFormat, DateFormat, NumberFormat } from '@/features/formatting/constants';
import type { Language } from '@/features/languages/types';
import type { ThemeType } from '@/features/settings/theme';
import type { Transaction } from '@/features/transactions/types';

import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { currentPeriodSelection } from '@/lib/date/helpers';
import { createSelectors } from '@/lib/utils';

export type TokenType = {
  access: string;
  refresh: string;
};

export type ColorThemeType = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'white';

export type PeriodMode = 'year' | 'month' | 'week' | 'custom';

export type PeriodSelection
  = | { mode: 'year'; year: number }
    | { mode: 'month'; year: number; month: number }
    | { mode: 'week'; year: number; week: number }
    | { mode: 'custom'; startDate: string; endDate: string };

const mmkv = createMMKV();
const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.remove(name),
};

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

  // Security
  lockEnabled: boolean;
  lockTimeoutMinutes: number;

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

const _useAppStore = create<AppState>()(
  persist(
    (_set) => ({
      profile: {
        name: '',
        avatar: 1,
      },
      token: null,
      authStatus: 'idle',
      currency: 'USD',
      currencyFormat: 'symbol-after',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'stop',
      monthStartDay: 1,
      theme: 'system',
      colorTheme: 'red',
      isFirstTime: true,
      language: undefined,
      lockEnabled: false,
      lockTimeoutMinutes: 1,
      aiProvider: 'openai',
      openaiApiKey: undefined,
      anthropicApiKey: undefined,
      lastUsed: {
        currency: 'USD',
        currencies: ['USD'],
      },
      formPrefs: {
        transactionForm: {},
        accountForm: {},
      },
      periodSelection: currentPeriodSelection(),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        profile: state.profile,
        token: state.token,
        currency: state.currency,
        currencyFormat: state.currencyFormat,
        dateFormat: state.dateFormat,
        monthStartDay: state.monthStartDay,
        theme: state.theme,
        isFirstTime: state.isFirstTime,
        language: state.language,
        lockEnabled: state.lockEnabled,
        lockTimeoutMinutes: state.lockTimeoutMinutes,
        aiProvider: state.aiProvider,
        openaiApiKey: state.openaiApiKey,
        anthropicApiKey: state.anthropicApiKey,
        lastUsed: state.lastUsed,
        formPrefs: state.formPrefs,
      }),
    },
  ),
);

export const useAppStore = createSelectors(_useAppStore);

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
  return _useAppStore.setState((prev) => ({ ...prev, currency }));
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
