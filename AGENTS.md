# AGENTS Guide - Spendwise

Spendwise is a local-first personal finance app built on Expo + React Native. Use this file as the canonical operating guide for AI agents working in this repository.

## Stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54 + React Native 0.81.5 |
| Language | TypeScript (strict) |
| Routing | Expo Router 6 — files under `src/app` |
| Styling | Uniwind (`className`) |
| Database | SQLite — source of truth for finance data |
| Preferences | Zustand + MMKV |
| Async data | React Query |
| Forms | TanStack Form + Zod |
| i18n | i18next |
| Testing | Jest + React Native Testing Library + Maestro |

## Project Structure

```
src/
├── app/          # Expo Router route files and layouts (keep thin)
├── features/     # Feature modules (home, accounts, transactions, budgets, …)
├── components/   # Shared components and UI primitives
├── lib/          # SQLite, storage, theme, i18n, API/query providers
└── translations/ # i18n JSON files
```

## Core Rules

- Use `@/` absolute imports everywhere.
- Keep `src/app` route files thin — delegate logic to `src/features/[feature]`.
- Store relational finance data in SQLite, not Zustand.
- Wrap SQLite reads/writes in React Query; invalidate affected queries after mutations.
- Use Zustand + MMKV for preferences and non-relational state only.
- Use TanStack Form + Zod for non-trivial forms.
- Prefer `src/components/ui` primitives before creating new controls.
- Style with Uniwind `className` and shared tokens; avoid inline style objects.
- Keep all user-facing copy translatable; update `src/translations` when adding strings.
- Do not edit `android/` or `ios/` directly for app logic.
- Update docs and `AGENTS.md` when architecture, routes, or major workflows change.

## Response And Planning Style

Keep responses concise, concrete, and tied to the actual codebase. When creating implementation plans: cite specific file paths, break work into logical testable steps, call out edge cases, and end with unresolved questions when requirements are ambiguous.

## Reference Docs

| Topic | File |
|---|---|
| Architecture, data layers, startup, routing | [`.docs/architecture.md`](.docs/architecture.md) |
| Feature modules and route map | [`.docs/features.md`](.docs/features.md) |
| Dev setup, env, and commands | [`.docs/setup.md`](.docs/setup.md) |
| Testing strategy and expectations | [`.docs/testing.md`](.docs/testing.md) |
| Build profiles and release checklist | [`.docs/release.md`](.docs/release.md) |
| Human-facing project overview | [`README.md`](README.md) |
