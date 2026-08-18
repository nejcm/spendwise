# Spendwise — Agent Guide

Local-first personal finance app on Expo + React Native. TypeScript strict, Expo Router under `src/app`, SQLite as the source of truth for financial data, React Query over it, Zustand + MMKV for preferences, Uniwind for styling, i18next in `en` + `de`. Exact versions live in `package.json` — read them there, not from prose.

Deeper reference: [`.docs/architecture.md`](.docs/architecture.md). Domain vocabulary: [`CONTEXT.md`](CONTEXT.md).

## What we never compromise on

- **Money is integer cents.** Every amount column is SQLite `INTEGER`. Never store or compute a float. Convert with `parseToCents` from `@/lib/data` (user input) or `amountToCents` / `centsToAmount` from `src/features/formatting/helpers.ts`. If you are writing `* 100` or `.toFixed(2)` anywhere else, stop.
- **Financial rows never leave the device.** SQLite is the boundary. PostHog (`src/lib/analytics/posthog.tsx`) runs with autocapture off and stays that way — never put an amount, account name, category name, merchant, or note into an event or error context. Event names and counts only.
- **AI is opt-in and bring-your-own-key.** Provider keys live on-device. No key, no request. Never add a default or fallback key, never route AI traffic through a Spendwise-owned endpoint.
- **The app works offline.** A failed rate fetch degrades to the last cached rate in `currency_rates`, never to a blank screen or a thrown error.
- **Migrations are forward-only against real money.** See Blast radius.

## Vocabulary

[`CONTEXT.md`](CONTEXT.md) is the glossary. Read it before naming anything, and use its terms when describing work back to me:

**Period**, **Today** (dynamic, the current day) vs **Day** (fixed, the selected one), **Custom Period**, **Budget Limit**, **Preferred Currency** (global, stored) vs **View Currency** (ephemeral, screen-local), **Account Order**. Today and Day are not interchangeable — that distinction has already caused one bug.

## The data layer

Every feature module under `src/features/*` follows the same three-file split. Don't invent a fourth shape.

| File | Contains | Rule |
|---|---|---|
| `queries.ts` | `async function fn(db, …)` | No React imports. Testable directly against an in-memory DB. |
| `hooks.ts` | React Query wrappers | Uses the SQLite context, imports keys from `queryKeys`, calls `invalidateFor()` on success, delegates to `queries.ts`. |
| `api.ts` | Re-export barrel | No logic. |

Query keys are centralized in `src/lib/data/query-keys.ts`; invalidation is declarative in `src/lib/data/invalidation.ts`. Hand-rolled `invalidateQueries` calls are exactly what that file replaced:

```ts
// bad — local keys, hand-listed fan-out, guaranteed to drift
const keys = { list: ['transactions', 'list'] };
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['accounts', 'balance'] });
}

// good — registry plus declarative rules
import { invalidateFor, queryKeys } from '@/lib/data';
useQuery({ queryKey: queryKeys.transactions.list(range), … });
onSuccess: () => invalidateFor(queryClient, 'transaction');
```

A transaction write already fans out to accounts, month summary, insights, recommendations, and global budget. Adding a mutation that touches a new entity means adding that entity to the invalidation rules — forgetting one is the classic stale-balance bug here.

## Hit every surface

The defect this repo ships is a change applied to the one path you tested. Before calling done, walk this:

- **Route siblings** — `src/app/(app)/` splits list / new / `[id]` / `[id]/edit` into separate files, and the set differs per entity (accounts has all four; categories has no detail route; transactions and scheduled have no separate edit route). Changing one usually means changing its siblings.
- **Query keys + invalidation** — `src/lib/data/query-keys.ts` and the entity's entry in `src/lib/data/invalidation.ts`.
- **Schema trio** — a new `user_version` block in `src/lib/sqlite/migrations.ts`, the feature's `types.ts`, and the backup module (bump the backup version and handle the old shape on restore).
- **Importers** — a new transaction field means CSV column mapping *and* the backup JSON round-trip. Both have tests next to them; extend those rather than adding new suites.
- **Both translations** — `src/translations/en.json` and `de.json`. ESLint enforces identical keys and sorted order, so `pnpm lint:translations` is the fast check.
- **Seed and mock data** — a new NOT NULL column breaks the seed and mock-data modules.
- **Docs** — `.docs/architecture.md` if you added a table or changed the data-layer shape; `CONTEXT.md` if you introduced a domain term.

## Reverse states

Anything that toggles ships its un-toggle in the same change, tested:

- Account archive → unarchive. `is_archived` filters through account lists, the transaction filter sheet, notification checks, and global-budget queries. Archiving must not orphan the account's transactions.
- App lock on → off must clear the lock gate, not just the setting.
- Each notification toggle off must cancel already-scheduled notifications, not just stop new ones.
- AI disable must make the key unreachable and hide the AI surface.
- Auto-backup on → off.
- Import: if there is no undo, say so in the UI before the write. There is no transaction log to walk back.

## Commands

pnpm only — `preinstall` runs `only-allow pnpm`. Node per `engines` in `package.json` (`^22.13.0 || >=24`).

- `pnpm verify` — lint + `tsc --noEmit` + translations + Jest. The gate.
- `pnpm lint:ts` — types only, fastest signal.
- `pnpm test -- path/to/file.test.ts` — targeted. Tests are colocated next to source.
- `pnpm lint:translations` — required after touching `src/translations/`. Runs with `--fix`, so it rewrites key order.
- `pnpm knip:check` — dead exports.
- `pnpm doctor` — Expo dependency alignment; only when touching native deps.

Assume a dev server is already running. Don't start one, don't kill one.

Fix lint and test failures your change introduced. Don't hand off a "done" task with a red `verify` unless you say plainly what is blocked and why, and state any checks you skipped.

## Blast radius

- **Migrations run at startup against real money.** `src/lib/sqlite/migrations.ts` is `PRAGMA user_version` gated and forward-only. Add a new `if (currentDbVersion < N)` block and set `PRAGMA user_version = N` at its end. Never edit an existing block, never renumber, never reorder — a shipped version has already run on someone's device.
- The DB bootstrap module drops every table, and the seed and mock-data modules delete rows. Never call them from app code, from a test helper that touches the real DB, or from a "let me just reset it" debug path.
- Deleting a column or index: SQLite will not give the rows back.
- No `git push`, no branch deletion, no `eas build` or release script unless asked — the release script tags and bumps the version.

## Conventions

`@/` absolute imports. Route files thin — logic lives in `src/features/[feature]`. Relational finance data in SQLite, not Zustand; Zustand + MMKV for preferences and non-relational state only. TanStack Form + Zod for non-trivial forms. Reach for `src/components/ui` primitives before building a new control. Style with Uniwind `className` and shared tokens. All user-facing copy is translatable.

## Reference

| Topic | File |
|---|---|
| Domain language | [`CONTEXT.md`](CONTEXT.md) |
| Architecture, data layers, routing | [`.docs/architecture.md`](.docs/architecture.md) |
| Feature modules and route map | [`.docs/features.md`](.docs/features.md) |
| Dev setup, env, commands | [`.docs/setup.md`](.docs/setup.md) |
| Testing strategy | [`.docs/testing.md`](.docs/testing.md) |
| Build profiles and release | [`.docs/release.md`](.docs/release.md) |
