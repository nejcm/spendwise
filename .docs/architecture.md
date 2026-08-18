# Architecture

## High-Level Overview

Spendwise is a local-first mobile finance app. Most user data stays on-device and the app bootstraps the local database at startup.

Core layers:

- **Expo Router** for navigation and route files
- **SQLite** for relational finance data
- **React Query** for query/mutation orchestration and cache invalidation
- **Zustand + MMKV** for persisted preferences and lightweight app state
- **Uniwind** for styling

## App Startup

`src/app/_layout.tsx` is the runtime entry point. It mounts app-wide providers around `SQLiteProvider`, whose `onInit` runs `bootstrapApp` (`src/lib/app-bootstrap.ts`, 15 s timeout, splash hidden when it settles):

1. Runs schema migrations (`migrateDb`)
2. Ensures the Android notification channel
3. Syncs due scheduled transactions

The provider tree then mounts the background workers and gates:

- `CurrencyRatesInitializer` — fetches/refreshes rates
- `ScheduledTransactionsProcessor` — reprocesses due rules and runs all notification checks (upcoming bills, budget alerts, low balance, weekly digest, recommendations) on launch, foreground resume, and daily
- `AutoBackupProcessor`
- `SecurityLock` — global app lock gate
- `PersistentTabBar`

## Data Layers

### SQLite

SQLite is the source of truth for core finance entities:

- `accounts`
- `categories`
- `transactions`
- `recurring_rules`
- `recurring_rule_runs`
- `currency_rates`

Plus `_meta`, an internal bookkeeping table. Schema and migrations live in `src/lib/sqlite`.

### React Query

Feature data modules expose `useQuery` / `useMutation` hooks backed by SQLite. Each feature is split into three files:

- **`queries.ts`** — exported pure `async function(db, ...)` functions. No React imports. Testable directly with in-memory SQLite.
- **`hooks.ts`** — thin React Query wrappers that call `useSQLiteContext()`, reference `queryKeys`, call `invalidateFor()`, and delegate to `queries.ts`.
- **`api.ts`** — re-exports everything from `hooks.ts` and `queries.ts` for backward compatibility.

#### Centralized Data Utilities (`src/lib/data/`)

| File | Purpose |
|------|---------|
| `query-keys.ts` | Single source of truth for all React Query cache keys. Import `queryKeys` instead of defining local key objects. |
| `invalidation.ts` | Entity-based invalidation rules. Call `invalidateFor(queryClient, 'transaction')` instead of manually listing query key arrays. |
| `money.ts` | Shared money helpers: `convertAmount` (re-exported from the currencies feature) and `parseToCents`. Cents conversion and currency formatting live in `src/features/formatting/helpers.ts`. |
| `index.ts` | Barrel re-export of the above three modules. |

Example mutation using the new patterns:

```typescript
// Before
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['accounts', 'balance'] });
  queryClient.invalidateQueries({ queryKey: ['insights'] });
  // ...3 more
}

// After
onSuccess: () => {
  invalidateFor(queryClient, 'transaction');
}
```

### Zustand + MMKV

Use the app store for non-relational persisted state such as:

- profile and onboarding status
- formatting and theme preferences
- language
- app lock settings
- AI provider and API keys
- form defaults and recent selections

Do not move transactional finance records into Zustand.

## Routing

- Route files live in `src/app`
- Most route files should stay thin and delegate to feature screens
- Primary visible tabs are home, transactions, categories, and stats
- `/transactions` is the shared route for seeded transaction drill-downs via search, filter, and date-range params
- Additional routed flows include accounts, transactions, categories, scheduled transactions, global budget, AI, onboarding, and settings subpages
- SDK 56 native tabs are deferred because the app uses a custom persistent tab bar with a central add/scan action. Keep route transitions simple unless a screen has a clear native affordance.

## Expo SDK 56

- EAS Update uses Hermes bytecode diffing through `updates.enableBsdiffPatchSupport`.
- The React Native New Architecture is always used on SDK 56; do not add `newArchEnabled` to app config.
- `expo-widgets`, Live Activities, and Expo UI are deferred until their APIs are stable enough for production use in this app.

## Feature Layout

The codebase is feature-first. Typical feature folders contain:

- screen components
- shared feature components
- `queries.ts` — pure SQLite query functions (testable without React)
- `hooks.ts` — React Query hooks wrapping `queries.ts`
- `api.ts` — backward-compat barrel re-exporting `hooks.ts` + `queries.ts`
- `types.ts`
- focused helpers

Keep feature logic close to the feature unless it is broadly reusable.

For new data access code: add query functions to `queries.ts`, add hooks to `hooks.ts`, use `queryKeys` from `@/lib/data/query-keys`, and call `invalidateFor` from `@/lib/data/invalidation`.

## Styling

- Use `className` with Uniwind utilities
- Reuse `src/components/ui` primitives before creating one-off controls
- Keep theme tokens and shared styling behavior centralized

## Internationalization

- Translations live in `src/translations`
- Prefer translation keys over hardcoded user-facing strings

## Privacy And Security

- Finance data is stored locally in SQLite
- Preferences and lightweight persisted state are stored in MMKV
- AI requests are sent directly from the client to OpenAI or Anthropic when configured
- App lock behavior is managed by the security feature and lock settings in app state
