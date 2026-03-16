# AGENTS Guide - Spendwise

Spendwise is a local-first personal finance app built on Expo + React Native. Use this file as the default operating guide for AI agents working in this repository.

## What: Technology Stack

- **Expo SDK 54** + **React Native 0.81.5**
- **TypeScript** with strict project-wide typing
- **Expo Router 6** for route files under `src/app`
- **Uniwind** for utility-based React Native styling
- **SQLite** for primary app data
- **Zustand + MMKV** for persisted preferences and lightweight app state
- **React Query** for async data access and cache invalidation
- **TanStack Form + Zod** for forms and validation
- **i18next** for translations
- **Jest + React Native Testing Library + Maestro** for testing

## What: Project Structure

```text
src/
├── app/              # Expo Router route files and layouts
├── features/         # Feature modules such as home, accounts, categories, transactions, stats, insights, budgets, goals, imports, currencies, settings, profile, onboarding, notifications, security, and AI
├── components/       # Shared app components and UI primitives
├── lib/              # SQLite, storage, theme, i18n, API/query providers, helpers
├── translations/     # Translation JSON files
└── global.css        # Uniwind theme/tokens/utilities

Root files:
├── env.ts            # Typed environment schema and derived Expo values
├── app.config.ts     # Expo configuration
├── eas.json          # EAS build profiles
├── README.md         # Human-facing project overview
└── docs/             # Deeper project documentation
```

## How: App Architecture

- Put screens, feature components, types, and query helpers together inside `src/features/[feature]`.
- Add route entry points in `src/app`; keep route files thin and delegate screen logic to feature modules.
- Treat **SQLite** as the source of truth for finance data such as accounts, transactions, budgets, goals, and currency rates.
- Use **React Query** around SQLite reads/writes and invalidate related queries after mutations.
- Use **Zustand + MMKV** for preferences and non-relational persisted state such as theme, onboarding state, formatting, lock settings, and AI provider keys.
- Prefer shared UI primitives from `src/components/ui` before introducing new ad hoc controls.
- Keep styling in `className` with Uniwind utilities and shared tokens rather than inline style objects when practical.
- Always use `@/` absolute imports.

## What: Important Runtime Behavior

- App bootstrapping happens in `src/app/_layout.tsx`.
- Startup initializes SQLite, runs migrations, sets up notifications, checks budget alerts, checks upcoming bills, and mounts the global providers.
- The app uses a custom persistent tab bar instead of Expo Router's default tabs.
- The AI feature sends client-side requests directly to provider APIs using user-supplied keys stored locally.

## How: Development Workflow

### Essential Commands

```bash
pnpm start
pnpm ios
pnpm android
pnpm web
pnpm lint
pnpm lint:ts
pnpm lint:all
pnpm test
pnpm verify
pnpm format
```

### Useful Supporting Commands

```bash
pnpm start:preview
pnpm start:production
pnpm ios:preview
pnpm ios:production
pnpm android:preview
pnpm android:production
pnpm build:development:ios
pnpm build:development:android
pnpm build:preview:ios
pnpm build:preview:android
pnpm build:production:ios
pnpm build:production:android
pnpm install-maestro
pnpm e2e-test
pnpm doctor
pnpm knip
```

`pnpm e2e-test` assumes Maestro is installed and currently targets the development app id.

## How: Essential Rules

- Do use absolute imports such as `@/features/transactions/api`.
- Do keep route files minimal; move real UI and data logic into `src/features`.
- Do use TanStack Form + Zod for non-trivial forms.
- Do store relational finance data in SQLite, not in Zustand or MMKV.
- Do use MMKV/Zustand for preferences, onboarding, lock state, and similar persisted app settings.
- Do keep translations in `src/translations` and use translation keys instead of hardcoded strings.
- Do update docs when adding major features, routes, or build/test workflows.
- Do use existing EAS profiles and Expo config for platform/build changes.
- Do not add new relative imports when an `@/` import is available.
- Do not edit `android/` or `ios/` directly for app logic changes.
- Do not introduce AsyncStorage for new persistence.

## How: Testing Expectations

- Run targeted tests after substantial changes and prefer `pnpm verify` before finishing larger work.
- Add or update Jest tests when changing helpers, form logic, or reusable components.
- Consider Maestro coverage for critical app flows that change onboarding or navigation behavior.
- Treat stale demo/starter test flows carefully; align new tests with actual Spendwise features.

## How: Docs And Rules

- `README.md` is for humans onboarding to the repo.
- `docs/*.md` contains deeper architecture, setup, testing, feature, and release references.
- `AGENTS.md` is the canonical high-level AI instruction file.
- `CLAUDE.md` should remain a lightweight compatibility pointer to this file.
- `.cursor/rules/spendwise-core.mdc` contains the always-on Cursor rule version of the core conventions.

## Responses

Keep responses concise, concrete, and tied to the actual codebase.

## Plans

When creating implementation plans:

- Make plans concise and actionable.
- Cite specific file paths and only the most relevant code.
- Break large work into logical, testable steps.
- Call out dependencies, edge cases, and validation steps.
- End with unresolved questions when requirements are ambiguous.

---

Use this file for durable agent guidance; keep deeper explanations in `docs/`.
