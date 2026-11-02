import type { Account } from '@/features/accounts/types';
import type { AiProviderType } from '@/features/ai/types';
import type { CurrencyKey } from '@/features/currencies';
import type { CurrencyFormat, DateFormat, NumberFormat } from '@/features/formatting/constants';
import type { AutoBackupInterval } from '@/features/imports-export/backup-file';
import type { Language } from '@/features/languages/types';
import type { NotificationSettings } from '@/features/notifications/types';

import type { ThemeType } from '@/features/settings/theme';
import type { Transaction } from '@/features/transactions/types';
import type { PrimaryTabPath } from '@/lib/navigation/persistent-tab-bar';
import type { AccentType } from '@/lib/theme/accent';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_DATE_FORMAT, DEFAULT_USER_CURRENCY } from '@/config';
import { CURRENCIES_MAP } from '@/features/currencies';
import { currentPeriodSelection, setPeriodMonthStartDay } from '@/lib/date/helpers';
import { createSelectors } from '@/lib/utils';
import { mmkvStorage } from '../storage';

export type LongPressActionType = 'scan_receipt' | 'pick_from_gallery';

export type DensityType = 'default' | 'compact';

export type HomeScreenChartType = 'none' | 'balance' | 'category_spending';

export type PeriodMode = 'year' | 'month' | 'week' | 'custom' | 'all' | 'today' | 'day' | 'this-week' | 'this-month' | 'this-year';

export type PeriodSelectionYear = { mode: 'year'; year: number };
export type PeriodSelectionMonth = { mode: 'month'; year: number; month: number };
export type PeriodSelectionWeek = { mode: 'week'; year: number; week: number };
export type PeriodSelectionCustom = { mode: 'custom'; startDate: string; endDate: string };
export type PeriodSelectionAll = { mode: 'all' };
export type PeriodSelectionToday = { mode: 'today' };
export type PeriodSelectionDay = { mode: 'day'; date: string };
export type PeriodSelectionThisWeek = { mode: 'this-week' };
export type PeriodSelectionThisMonth = { mode: 'this-month' };
export type PeriodSelectionThisYear = { mode: 'this-year' };
export type PeriodSelection
  = | PeriodSelectionYear
    | PeriodSelectionMonth
    | PeriodSelectionWeek
    | PeriodSelectionCustom
    | PeriodSelectionAll
    | PeriodSelectionToday
    | PeriodSelectionDay
    | PeriodSelectionThisWeek
    | PeriodSelectionThisMonth
    | PeriodSelectionThisYear;

export type AutoBackupSettings = {
  enabled: boolean;
  interval: AutoBackupInterval;
  lastAutoBackupAt: string | null;
  retention?: number;
  lastBackupStats?: BackupStats;
};

export type BackupStats = { transactions: number; accounts: number; bytes: number };

export type AiFeature = 'chat' | 'scan' | 'insights';

export type AppState = {
  // Profile
  profile: {
    name: string;
    /** 0 = initials on `avatarColor`; otherwise an illustrated avatar id. */
    avatar: number;
    avatarColor?: string;
  };

  // Preferences
  currency: CurrencyKey;
  currencyFormat: CurrencyFormat;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  monthStartDay: number;
  theme: ThemeType;
  colorTheme: AccentType;
  isFirstTime: boolean;
  language: Language | undefined;
  notifications: NotificationSettings;
  autoBackup: AutoBackupSettings;
  saveOnScan: boolean | undefined;
  openTxOnCreate: boolean;
  longPressAction: LongPressActionType;
  recommendationsEnabled: boolean;
  density: DensityType;
  homeScreenChart: HomeScreenChartType;
  lastPrimaryTabPath: PrimaryTabPath;
  setupChecklistHidden?: boolean;

  // Security
  lockEnabled: boolean;
  lockTimeoutMinutes: number;
  isLocked: boolean; // runtime only — not persisted
  analyticsEnabled?: boolean;

  // AI
  aiProvider: AiProviderType;
  openaiApiKey: string | undefined;
  anthropicApiKey: string | undefined;
  aiFeatures?: Partial<Record<AiFeature, boolean>>;

  // Other
  lastUsed: {
    currencies: CurrencyKey[];
  };

  // Form preferences
  formPrefs: {
    transactionForm: Partial<Pick<Transaction, 'type' | 'currency' | 'category_id' | 'account_id'>>;
    accountForm: Partial<Pick<Account, 'type' | 'currency'>>;
  };

  // Period preference
  periodSelection: PeriodSelection;
};

function getLocaleCurrency(): CurrencyKey {
  const code = getLocales()[0]?.currencyCode;
  return code && code in CURRENCIES_MAP ? code as CurrencyKey : DEFAULT_USER_CURRENCY;
}

function getDefaultState(): AppState {
  const currency = getLocaleCurrency();
  return {
    profile: {
      name: '',
      avatar: 0,
    },
    currency,
    currencyFormat: 'symbol-after',
    dateFormat: DEFAULT_DATE_FORMAT,
    numberFormat: 'stop',
    monthStartDay: 1,
    theme: 'system',
    colorTheme: 'spendwise',
    isFirstTime: true,
    language: undefined,
    saveOnScan: undefined,
    openTxOnCreate: false,
    longPressAction: 'scan_receipt',
    recommendationsEnabled: true,
    density: 'default',
    homeScreenChart: 'balance',
    lastPrimaryTabPath: '/',
    lockEnabled: false,
    lockTimeoutMinutes: 1,
    isLocked: false,

    aiProvider: 'openai',
    openaiApiKey: undefined,
    anthropicApiKey: undefined,
    aiFeatures: undefined,

    notifications: {
      budgetAlerts: true,
      recommendations: true,
      upcomingBills: true,
      upcomingBillsDays: 1,
      lowBalance: true,
      lowBalanceThresholdCents: 10000,
      weeklyDigest: false,
    },
    autoBackup: {
      enabled: false,
      interval: 'daily',
      lastAutoBackupAt: null,
      retention: 5,
    },
    lastUsed: {
      currencies: [currency],
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
      version: 2,
      storage: createJSONStorage(() => mmkvStorage),
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          if (state.homeScreenChart === 'monthly_spending') state.homeScreenChart = 'balance';
          state.openTxOnCreate ??= true;
        }
        return state as AppState;
      },
      partialize: ({ isLocked: _, ...rest }) => rest as AppState,
    },
  ),
);

export const useAppStore = createSelectors(_useAppStore);

setPeriodMonthStartDay(_useAppStore.getState().monthStartDay);
_useAppStore.subscribe((state) => setPeriodMonthStartDay(state.monthStartDay));

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

// Preference actions
export function hideSetupChecklist() {
  return updateAppState({ setupChecklistHidden: true });
}
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
  const { periodSelection } = getAppState();
  const current = currentPeriodSelection();
  const wasCurrentMonth = periodSelection.mode === 'month' && periodSelection.year === current.year && periodSelection.month === current.month;
  updateAppState({ monthStartDay });
  if (wasCurrentMonth) setPeriodSelection(currentPeriodSelection());
}

export function setTheme(theme: ThemeType) {
  return updateAppState({ theme });
}

export function setAccentColor(colorTheme: AccentType) {
  return updateAppState({ colorTheme });
}

export function setDensity(density: DensityType) {
  return updateAppState({ density });
}

export function setLastPrimaryTabPath(lastPrimaryTabPath: PrimaryTabPath) {
  return updateAppState({ lastPrimaryTabPath });
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
  const key = state.aiProvider === 'anthropic'
    ? state.anthropicApiKey
    : state.openaiApiKey;
  return Boolean(key?.trim());
}

/** A key is saved and the feature isn't switched off in AI settings (missing = on). */
export function selectIsAiFeatureOn(feature: AiFeature) {
  return (state: AppState) => selectIsAiEnabled(state) && state.aiFeatures?.[feature] !== false;
}

export function setAiFeature(feature: AiFeature, on: boolean) {
  return updateAppState((prev) => ({ aiFeatures: { ...prev.aiFeatures, [feature]: on } }));
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

export function updateAutoBackup(partial: Partial<AutoBackupSettings>) {
  return updateAppState((prev) => ({ autoBackup: { ...prev.autoBackup, ...partial } }));
}
export const selectAutoBackup = (state: AppState) => state.autoBackup;
