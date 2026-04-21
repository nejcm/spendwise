# Features

## Route Map

### Primary App Routes

- `src/app/(app)/index.tsx`: home dashboard
- `src/app/(app)/categories.tsx`: category management
- `src/app/(app)/stats.tsx`: stats overview
- `src/app/(app)/settings.tsx`: settings landing page
- `src/app/(app)/accounts.tsx`: accounts list
- `src/app/(app)/transactions.tsx`: transaction list
- `src/app/(app)/ai.tsx`: AI assistant

### Secondary Routes

- `src/app/onboarding.tsx`
- `src/app/(app)/accounts/[id].tsx`
- `src/app/(app)/transactions/[id].tsx`
- `src/app/(app)/scheduled/index.tsx`
- `src/app/(app)/scheduled/[id].tsx`
- `src/app/(app)/settings/profile.tsx`
- `src/app/(app)/settings/general.tsx`
- `src/app/(app)/settings/formatting.tsx`
- `src/app/(app)/settings/import-export.tsx`
- `src/app/(app)/settings/notifications.tsx`
- `src/app/(app)/settings/security.tsx`
- `src/app/(app)/settings/ai.tsx`
- `src/app/(app)/settings/privacy.tsx`
- `src/app/(app)/settings/terms.tsx`

## Feature Modules

### Core Finance

- `accounts`: account CRUD, account balances
- `categories`: category CRUD, ordering, picker/grid UI
- `transactions`: list, detail, form, summaries, filters, and balance updates

### Planning And Tracking

- `stats`: high-level summaries, trends, category breakdowns
- `insights`: deeper trend and monthly analytics
- `scheduled-transactions`: recurring rules, due-date tracking, and processing

### Utility Flows

- `imports-export`: CSV parsing, mapping, preview, import/export, and JSON backup/restore
- `currencies`: rate fetching/storage and currency helpers
- `formatting`: number/date/currency display preferences
- `notifications`: permissions, reminders, budget alerts, upcoming bill checks
- `security`: app lock and lock screen behavior

### Settings And Setup

- `settings`: settings landing UI and setting-specific sections
- `profile`: profile settings
- `languages`: locale support types/helpers
- `onboarding`: first-run setup flow

### Optional / Starter-Carried Areas

- `ai`: AI chat and provider settings using client-side provider calls. Exports a single `useChat` hook from `index.ts`; internals (context assembly, provider adapters, streaming, message persistence) are private.

## Contributor Notes

- Add new route entry points under `src/app`
- Keep route files thin and put feature logic in `src/features/[feature]`
- Prefer extending an existing feature module before creating a new cross-cutting folder
