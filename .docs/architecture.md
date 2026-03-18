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

`src/app/_layout.tsx` is the runtime entry point. On startup it:

1. Mounts app-wide providers
2. Initializes the SQLite database
3. Runs schema migrations
4. Sets up notifications
5. Checks budget alerts and upcoming bills
6. Initializes currency rates
7. Mounts the global security lock

## Data Layers

### SQLite

SQLite is the source of truth for core finance entities:

- `accounts`
- `categories`
- `transactions`
- `budgets`
- `budget_lines`
- `recurring_rules`
- `goals`
- `currency_rates`

Schema and migrations live in `src/lib/sqlite`.

### React Query

Feature `api.ts` files typically wrap SQLite access in `useQuery` / `useMutation`, then invalidate related queries after writes. Use this pattern for async UI state that depends on persistent data.

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
- Primary visible tabs are home, categories, stats, and settings
- Additional routed flows include accounts, transactions, goals, budgets, import, insights, onboarding, and settings subpages

## Feature Layout

The codebase is feature-first. Typical feature folders contain:

- screen components
- shared feature components
- `api.ts` query/mutation hooks
- `types.ts`
- focused helpers

Keep feature logic close to the feature unless it is broadly reusable.

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
