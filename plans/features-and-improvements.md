# Features & Improvements Plan

Scoped and agreed via design interview on 2026-04-28.

---

## 1. Global Budget

A single user-defined monthly spending cap tracked across all expense transactions, independent of per-category or per-account budgets.

**Decisions:**
- Stored in SQLite (`_meta` key-value table — survives JSON backup/restore automatically)
- Fixed monthly amount; scales for other periods via existing `scaleBudgetForPeriod`
- Displayed as a separate card **above** the existing category budget summary on the budget screen
- Counts **all** expense transactions (not just budgeted categories)
- Plugs into existing notification system at 80% and 100% thresholds

### Phase 1 — Data Layer
- Read/write `global_monthly_budget` (cents) from the existing `_meta` table
- Add `getGlobalBudget` / `setGlobalBudget` query functions in `src/features/stats/queries.ts`
- Add `useGlobalBudget` / `useSetGlobalBudget` React Query hooks
- Add `global_budget` query key to `src/lib/data/query-keys.ts`
- Add invalidation entry to `src/lib/data/invalidation.ts`
- Query total expense spend for the selected period (all accounts, all categories) — reuse existing transaction sum patterns

### Phase 2 — UI
- `GlobalBudgetCard` component: shows spent / budget, progress bar, remaining/overspent — mirrors `BudgetSummary` style
- Inline "Set budget" affordance on the card when no budget is configured
- Edit via existing bottom sheet pattern (new `set-global-budget` sheet type)
- Render `GlobalBudgetCard` at the top of `BudgetTab` (single-month and range views), above `BudgetSummary`
- Scale displayed budget for multi-month range view using `scaleBudgetForPeriod`

### Phase 3 — Notifications
- Extend `check-budget-alerts.ts` to check global budget alongside per-category/account budgets
- Reuse existing `BudgetAlertType` and threshold constants (80%, 100%)
- Add translation keys for global budget alert messages

---

## 2. Transaction Tags

Freeform cross-cutting labels applied to transactions, independent of categories. Useful for grouping across category boundaries (e.g. "business", "vacation", "reimbursable").

**Decisions:**
- Global predefined list (name + color), managed separately, reused across transactions
- Multiple tags per transaction (many-to-many)
- Color metadata only (no icons)
- Surfaces as chips on transaction list cards + filter by tag

### Phase 1 — Data Layer
- SQLite migration (bump `DATABASE_VERSION`):
  - `tags` table: `id`, `name`, `color`, `sort_order`, `created_at`
  - `transaction_tags` junction table: `transaction_id` (FK), `tag_id` (FK), `PRIMARY KEY (transaction_id, tag_id)`
  - Indexes: `idx_transaction_tags_transaction`, `idx_transaction_tags_tag`
- Query functions: `getTags`, `createTag`, `updateTag`, `deleteTag`, `getTagsForTransaction`, `setTransactionTags`
- React Query hooks: `useTags`, `useCreateTag`, `useUpdateTag`, `useDeleteTag`, `useTransactionTags`, `useSetTransactionTags`
- Query keys + invalidation wired to `transaction` and `tag` entities
- Update JSON export/import to include `tags` and `transaction_tags` tables

### Phase 2 — Tag Management UI
- Tag form component (name + color picker) — mirrors category form pattern
- Tag management screen at `src/app/(app)/settings/tags.tsx`
- Add "Tags" entry to the settings screen
- CRUD: create, edit, delete (with confirmation if tag is in use)
- `TagChip` shared UI component (pill with color dot + name)

### Phase 3 — Transaction Integration
- Add tag multi-selector to transaction form (bottom of form, below note field)
- Load existing tags for a transaction when editing
- Display `TagChip` list on `TransactionCard` in the transaction list (hidden when no tags)
- Persist tag assignments on create/update via `useSetTransactionTags` mutation

### Phase 4 — Filtering
- Add "Tags" section to `TransactionFilterSheet`
- Multi-select tag filter (OR logic: show transactions matching any selected tag)
- Update transaction list query to accept `tagIds` filter param
- Show active tag filters in `TransactionFilterBar` as removable chips

---

## 3. Home Screen Improvements

### Phase 1 — Trend Indicators on Income/Expense Cards
- Query prior month's income and expense totals (reuse `useMonthSummary` pattern)
- Calculate % change: `((current - prior) / prior) * 100`
- Display inline below each amount: `↑ 12%` (green) / `↓ 8%` (red) vs last month
- Handle edge cases: prior month zero (show "—"), loading state (skeleton)
- New hook `useMonthTrend(currentMonth)` returning `{ incomeDelta, expenseDelta }`

### Phase 2 — Navigation Grid Refactor
- Remove from `DESTINATIONS` the three routes already in the bottom tab bar: `transactions`, `categories`, `stats`
- Remaining destinations (5): Accounts, Scheduled, Settings, AI, Scan
- Change layout from `flex-wrap` grid to horizontal `ScrollView` with fixed-width icon+label tiles
- Reduce tile size to fit comfortably in a single horizontal row

---

## 4. Stats Improvements

### Phase 1 — 6-Month Spending Bar Chart
- New `MonthlySpendChart` component on the stats overview tab
- Query last 6 calendar months of expense totals grouped by month — new `useMonthlySpendTrend` hook
- Bar chart using existing chart library patterns (see `BudgetMonthChart` for reference)
- Render above or below the existing `Summary` component on the overview tab
- Respect selected currency; convert via existing `convertAmount` helpers

### Phase 2 — Category Drill-Down
- Make each row in `CategoryBreakdown` / `BudgetCategoryList` tappable
- On tap: navigate to `/transactions` with pre-applied filters for `categoryId` + current period date range
- Pass filters via route params or the existing filter store pattern
- Ensure back-navigation returns to stats at the same scroll position / tab

---

## 5. AI Assistant — Suggested Follow-Ups

### Phase 1 — Follow-Up Questions
- After each assistant message is fully streamed, extract or generate 2–3 contextual follow-up questions
- Two approaches (pick simpler one first):
  - **Static inference**: map known response topics (spending summary, category breakdown, budget status) to a predefined follow-up set
  - **Model-generated**: append a tool or system instruction asking the model to emit structured follow-up suggestions at the end of its response
- Render follow-ups as tappable pill buttons below the assistant message bubble (same `SolidButton` style as existing preset questions)
- Tapping a follow-up sends it as the next user message immediately
- Follow-ups disappear once the user sends any message (they are per-response, not persistent)
- Follow-ups only render on the most recent assistant message, not historical ones
