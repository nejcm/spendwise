import type { CurrencyKey } from '../features/currencies';
import type { DateFormat } from '../features/formatting/constants';

export const config = {
  appName: 'Spendwise',
  links: {
    androidApp: 'TODO',
    iosApp: 'TODO',
    support: 'https://github.com/nejcm/spendwise',
  },
};

// System
export const DB_NAME = 'spendwise.db';

export const OPEN_AI_MODEL = 'gpt-5.4-mini';
export const ANTHROPIC_MODEL = 'claude-haiku-4-5';
export const AI_MAX_TOOL_ROUNDS = 3;

export const DEFAULT_DATE_FORMAT = 'MMM d, yyyy' satisfies DateFormat;
export const DEFAULT_CURRENCY = 'EUR' satisfies CurrencyKey; // system base currency for rates
export const DEFAULT_USER_CURRENCY = 'USD' satisfies CurrencyKey; // user default currency

export const DEFAULT_CATEGORY_ID = '_unknown';

// AI

export const OPEN_AI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_MAX_TOKENS = 1024;
