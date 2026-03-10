import type { Language } from '@/features/languages';

import en from '@/translations/en.json';

export const resources = {
  en: {
    translation: en,
  },
} satisfies Record<Language, { translation: Record<string, any> }>;
