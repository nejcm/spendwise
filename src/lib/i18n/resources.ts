import type { Language } from '@/features/languages/types';

import de from '@/translations/de.json';
import en from '@/translations/en.json';

export const resources = {
  de: {
    translation: de,
  },
  en: {
    translation: en,
  },
} satisfies Record<Language, { translation: Record<string, any> }>;
