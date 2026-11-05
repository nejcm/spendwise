import type { Language } from './types';

type LanguageOption = {
  name: string;
  value: Language;
  image: string;
};

const LANGUAGES: LanguageOption[] = [
  { name: 'English', value: 'en', image: require('../../../assets/flags/us.jpg') },
  { name: 'Deutsch', value: 'de', image: require('../../../assets/flags/de.jpg') },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0]; // default to English

export const LANGUAGES_OPTIONS = LANGUAGES.map((lang) => ({ ...lang, label: lang.name, value: lang.value }));
