import type { Language } from '@/features/languages/types';

import en from '@/translations/en.json';

export const resources = {
  en: {
    translation: en,
  },
} satisfies Record<Language, { translation: Record<string, any> }>;
