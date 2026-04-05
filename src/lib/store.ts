import type { Account } from '@/features/accounts/types';
import type { AiProviderType } from '@/features/ai/types';
import type { CurrencyKey } from '@/features/currencies';
import type { CurrencyFormat, DateFormat, NumberFormat } from '@/features/formatting/constants';
import type { Language } from '@/features/languages/types';
import type { NotificationSettings } from '@/features/notifications/types';
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

export type PeriodMode = 'year' | 'month' | 'week' | 'custom' | 'all';

export type PeriodSelectionYear = { mode: 'year'; year: number };
export type PeriodSelectionMonth = { mode: 'month'; year: number; month: number };
export type PeriodSelectionWeek = { mode: 'week'; year: number; week: number };
export type PeriodSelectionCustom = { mode: 'custom'; startDate: string; endDate: string };
export type PeriodSelectionAll = { mode: 'all' };
export type PeriodSelection = PeriodSelectionYear | PeriodSelectionMonth | PeriodSelectionWeek | PeriodSelectionCustom | PeriodSelectionAll;

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
  notifications: NotificationSettings;
  saveOnScan: boolean | undefined;

  // Security
  lockEnabled: boolean;
  lockTimeoutMinutes: number;
  isLocked: boolean; // runtime only — not persisted

  // AI
  aiProvider: AiProviderType;
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
    saveOnScan: undefined,
    lockEnabled: false,
    lockTimeoutMinutes: 1,
    isLocked: false,

    aiProvider: 'openai',
    openaiApiKey: undefined,
    anthropicApiKey: undefined,

    notifications: {
      budgetAlerts: true,
      upcomingBills: true,
      upcomingBillsDays: 7,
      lowBalance: false,
      lowBalanceThresholdCents: 5000,
      weeklyDigest: false,
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

export function updateAppState(state: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) {
  return _useAppStore.setState((prev) => ({ ...prev, ...(typeof state === 'function' ? state(prev) : state) }));
};

// Profile actions
export function setProfile(profile: AppState['profile']) {
  return updateAppState({ profile });
}
export function updateProfile(profile: Partial<AppState['profile']>) {
  return updateAppState((prev) => ({ profile: { ...prev.profile, ...profile } }));
}
export const selectProfile = (state: AppState) => state.profile;

// Auth actions
export function signIn(token: TokenType) {
  return updateAppState({ token, authStatus: 'signIn' });
}

export function signOut() {
  return updateAppState({ token: null, authStatus: 'signOut' });
}

export function hydrateAuth() {
  const { token } = getAppState();
  if (token !== null) signIn(token);
  else signOut();
}

// Preference actions
export function setCurrency(currency: CurrencyKey) {
  return updateAppState({ currency: currency.length > 0 ? currency : DEFAULT_USER_CURRENCY });
}

export function setCurrencyFormat(currencyFormat: AppState['currencyFormat']) {
  return updateAppState({ currencyFormat });
}

export function setDateFormat(dateFormat: AppState['dateFormat']) {
  return updateAppState({ dateFormat });
}

export function setNumberFormat(numberFormat: AppState['numberFormat']) {
  return updateAppState({ numberFormat });
}

export function setMonthStartDay(monthStartDay: number) {
  return updateAppState({ monthStartDay });
}

export function setTheme(theme: ThemeType) {
  return updateAppState({ theme });
}

export function setIsFirstTime(isFirstTime: boolean) {
  return updateAppState({ isFirstTime });
}

export function setLanguage(language: Language) {
  return updateAppState({ language });
}

// AI actions
export function setAiProvider(aiProvider: AppState['aiProvider']) {
  return updateAppState({ aiProvider });
}

export function setOpenaiApiKey(openaiApiKey: string | undefined) {
  return updateAppState({ openaiApiKey });
}

export function setAnthropicApiKey(anthropicApiKey: string | undefined) {
  return updateAppState({ anthropicApiKey });
}

export function selectIsAiEnabled(state: AppState) {
  return Boolean(state.openaiApiKey) || Boolean(state.anthropicApiKey);
}

// Security actions
export function setLockEnabled(lockEnabled: boolean) {
  return updateAppState({ lockEnabled });
}

export function setIsLocked(isLocked: boolean) {
  return updateAppState({ isLocked });
}

export function setLockTimeoutMinutes(lockTimeoutMinutes: number) {
  return updateAppState({ lockTimeoutMinutes });
}

// Period selection actions
export function setPeriodSelection(periodSelection: PeriodSelection) {
  return updateAppState({ periodSelection });
}

// Other actions
export function setLastUsed(lastUsed: AppState['lastUsed']) {
  return updateAppState({ lastUsed });
}
export function updateLastUsed(lastUsed: Partial<AppState['lastUsed']>) {
  return updateAppState((prev) => ({ lastUsed: { ...prev.lastUsed, ...lastUsed } }));
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
  return updateAppState((prev) => ({ formPrefs: { ...prev.formPrefs, ...prefs } }));
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
  return updateAppState((prev) => ({ notifications: { ...prev.notifications, ...notifications } }));
}
export const selectNotifications = (state: AppState) => state.notifications;
export const selectNotificationSettings = (state: AppState) => state.notifications;
