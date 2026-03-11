import type { StateStorage } from 'zustand/middleware';

import type { Language } from '@/features/languages/types';
import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createSelectors } from '@/lib/utils';

export type TokenType = {
  access: string;
  refresh: string;
};

export type ThemeType = 'light' | 'dark' | 'system';
export type ColorThemeType = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'white';

const mmkv = createMMKV();
const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.remove(name),
};

type AppState = {
  // Auth
  token: TokenType | null;
  authStatus: 'idle' | 'signOut' | 'signIn';

  // Preferences
  currency: string;
  theme: ThemeType;
  colorTheme: ColorThemeType;
  isFirstTime: boolean;
  language: Language | undefined;

  // Security
  lockEnabled: boolean;
  lockTimeoutMinutes: number;
};

const _useAppStore = create<AppState>()(
  persist(
    (_set) => ({
      // Auth
      token: null,
      authStatus: 'idle',

      // Preferences
      currency: 'EUR',
      theme: 'system',
      colorTheme: 'red',
      isFirstTime: true,
      language: undefined,

      // Security
      lockEnabled: false,
      lockTimeoutMinutes: 1,
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        token: state.token,
        currency: state.currency,
        theme: state.theme,
        isFirstTime: state.isFirstTime,
        language: state.language,
        lockEnabled: state.lockEnabled,
        lockTimeoutMinutes: state.lockTimeoutMinutes,
      }),
    },
  ),
);

export const useAppStore = createSelectors(_useAppStore);

// Selectors
export const getAppState = () => _useAppStore.getState();

// Auth actions
export function signIn(token: TokenType) {
  return _useAppStore.setState({ token, authStatus: 'signIn' });
}

export function signOut() {
  return _useAppStore.setState({ token: null, authStatus: 'signOut' });
}

export function hydrateAuth() {
  const { token } = _useAppStore.getState();
  if (token !== null) signIn(token);
  else signOut();
}

// Preference actions
export function setCurrency(currency: string) {
  return _useAppStore.setState({ currency });
}

export function setTheme(theme: ThemeType) {
  return _useAppStore.setState({ theme });
}

export function setIsFirstTime(isFirstTime: boolean) {
  return _useAppStore.setState({ isFirstTime });
}

export function setLanguage(language: Language) {
  return _useAppStore.setState({ language });
}

// Security actions
export function setLockEnabled(lockEnabled: boolean) {
  return _useAppStore.setState({ lockEnabled });
}

export function setLockTimeoutMinutes(lockTimeoutMinutes: number) {
  return _useAppStore.setState({ lockTimeoutMinutes });
}
