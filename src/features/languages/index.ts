import type { Language } from './types';
import { translate } from '../../lib/i18n';

export type LanguageOption = {
  name: string;
  value: Language;
  image: string;
};

export const LANGUAGES: LanguageOption[] = [
  { name: translate('settings.english'), value: 'en', image: require('../../../assets/flags/us.svg') },
];
