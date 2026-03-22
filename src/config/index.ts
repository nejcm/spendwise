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

export const DEFAULT_DATE_FORMAT = 'MMM d, yyyy' satisfies DateFormat;
export const DEFAULT_CURRENCY = 'EUR' satisfies CurrencyKey;
export const DEFAULT_USER_CURRENCY = 'USD' satisfies CurrencyKey;
