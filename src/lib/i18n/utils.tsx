import type TranslateOptions from 'i18next';
import type { Language } from '../../features/languages/types';
import type { resources } from './resources';
import type { RecursiveKeyOf } from './types';
import { memoize } from 'es-toolkit/compat';
import i18n from 'i18next';
import { useCallback, useMemo } from 'react';

import { I18nManager, NativeModules, Platform } from 'react-native';
import RNRestart from 'react-native-restart';

import { getAppState, setLanguage, useAppStore } from '@/lib/store';
import { DEFAULT_LANGUAGE, LANGUAGES_OPTIONS } from '../../features/languages';
import { IS_WEB } from '../base';

type DefaultLocale = typeof resources.en.translation;
export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;

export const LOCAL = 'local';

export const getLanguage = () => getAppState().language;

export const translate = memoize(
  (key: TxKeyPath, options = undefined) => i18n.t(key, options) as unknown as string,
  (key: TxKeyPath, options: typeof TranslateOptions) => (options ? key + JSON.stringify(options) : key),
);

export function changeLanguage(lang: Language) {
  i18n.changeLanguage(lang);
  I18nManager.forceRTL(false);
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    if (__DEV__)
      NativeModules.DevSettings.reload();
    else RNRestart.restart();
  }
  else if (IS_WEB) {
    window.location.reload();
  }
}

export function useSelectedLanguage() {
  const language = useAppStore.use.language();

  const setLang = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      if (lang !== undefined)
        changeLanguage(lang);
    },
    [],
  );

  const selected = useMemo(() => (
    (language ? LANGUAGES_OPTIONS.find((lang) => lang.value === language) : undefined) || DEFAULT_LANGUAGE
  ), [language]);

  return { language: language as Language, selected, setLanguage: setLang };
}
