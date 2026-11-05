/* eslint-disable react-refresh/only-export-components */
import { setDefaultOptions } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import { resources } from './resources';
import { getLanguage } from './utils';

export * from './utils';

// Lets every bare date-fns `format` call pick up the app language.
i18n.on('languageChanged', () => setDefaultOptions({ locale: i18n.resolvedLanguage === 'de' ? de : enUS }));

i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage() || getLocales()[0]?.languageTag, // TODO: if you are not supporting multiple languages or languages with multiple directions you can set the default value to `en`
  fallbackLng: 'en',
  debug: false,
  supportedLngs: Object.keys(resources),
  nonExplicitSupportedLngs: true,
  compatibilityJSON: 'v4', // Updated to v4 for i18next compatibility

  // allows integrating dynamic values into translations.
  interpolation: {
    escapeValue: false, // escape passed in values to avoid XSS injections
  },
});

// Is it a RTL language?
const isRTL: boolean = i18n.dir() === 'rtl';

I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);
