# Testing

## Test Stack

- **Jest** for unit and component tests
- **React Native Testing Library** for rendering and interaction tests
- **Maestro** for mobile flow automation

## Commands

```bash
pnpm test
pnpm test:watch
pnpm test:ci
pnpm install-maestro
pnpm e2e-test
pnpm verify
```

`pnpm e2e-test` assumes Maestro is installed and currently targets the development app id from `package.json`.

## What To Cover

- Pure helpers and transformations
- Form validation and submission logic
- Shared UI primitives with meaningful interaction
- Feature logic that can regress without full device testing
- Critical navigation and onboarding flows when routes or startup behavior change

## Current Reality

- Existing Jest coverage is strongest around UI primitives and smaller helpers
- Maestro exists, but some scenarios still reflect starter/demo flows and should be refreshed as the product evolves

## Expectations For Changes

- Add or update Jest tests when changing reusable components, helpers, or important feature logic
- Run targeted tests after meaningful edits
- Prefer `pnpm verify` before wrapping larger tasks
- If onboarding, navigation, or critical app flows change, assess whether Maestro coverage should also change

## Suggested Priorities

- Refresh Maestro journeys to match current Spendwise screens
- Add tests around budgets/goals/import/security flows as those areas mature
