# AGENTS Guide - Spendwise

This repository is based on the [Obytes starter](https://starter.obytes.com) and uses Expo + React Native with a feature-oriented structure.

Use this file as the default operating guide for AI coding agents working in this codebase.

## What: Technology Stack

- **Expo SDK 54** with React Native 0.81.5 - Managed React Native development
- **TypeScript** - Strict type safety throughout
- **Expo Router 6** - File-based routing (like Next.js)
- **TailwindCSS** via Uniwind/Nativewind - Utility-first styling for React Native
- **Zustand** - Lightweight global state management
- **React Query** - Server state and data fetching
- **TanStack Form + Zod** - Type-safe form handling and validation
- **MMKV** - Encrypted local storage
- **Jest + React Testing Library** - Unit testing

## What: Project Structure

```
src/
├── app/              # Expo Router file-based routes (add new routes here)
├── features/         # Feature modules - auth, feed, settings are EXAMPLES
├── components/ui/    # Pre-built UI components (button, input, modal, etc.)
├── lib/              # Pre-configured utilities (api, auth, i18n, storage)
├── translations/     # i18n files (en.json, ... - add more languages)
└── global.css        # TailwindCSS configuration

Root Files:
├── env.ts           # Environment config (CUSTOMIZE bundle IDs, API URLs)
├── app.config.ts    # Expo configuration
└── README.md        # Project-specific documentation
```

## How: Development Workflow

**Essential Commands:**

```bash
pnpm start              # Start dev server
pnpm ios/android        # Run on platform
pnpm lint               # ESLint check
pnpm lint:ts            # TypeScript validation
pnpm test               # Run Jest tests
pnpm lint:ts            # All quality checks
pnpm format             # Format code
```

**Environment-Specific:**

```bash
pnpm start:preview              # Preview environment
pnpm ios:production             # Production iOS
pnpm build:production:ios       # EAS production build
```

## How: Key Patterns

- **Create features**: New folder in `src/features/[your-feature]/` with screens, components, API hooks
- **Add routes**: Create files in `src/app/` (file-based routing)
- **Forms**: Use TanStack Form + Zod (see `src/features/auth/components/login-form.tsx`)
- **Data fetching**: Use React Query (see `src/features/feed/api.ts`)
- **Global state**: Use Zustand (see `src/features/auth/use-auth-store.tsx`)
- **Styling**: NativeWind/Tailwind classes (see `src/components/ui/button.tsx`)
- **Storage**: Use MMKV via `src/lib/storage.tsx` for sensitive data
- **Imports**: Always use `@/` prefix, never relative imports

## How: Essential Rules

- ✅ **DO** use absolute imports: `@/components/ui/button`
- ✅ **DO** follow feature-based structure: `src/features/[name]/`
- ✅ **DO** use TanStack Form for forms (not react-hook-form)
- ✅ **DO** use MMKV storage for sensitive data (not AsyncStorage)
- ✅ **DO** use EAS Build for production: `pnpm build:production:ios`
- ✅ **DO** prefix env vars with `EXPO_PUBLIC_*` for app access
- ❌ **DO NOT** modify `android/` or `ios/` directly (use Expo config plugins)

## Platform and Build Rules

- Do not directly edit native `android/` or `ios/` projects for app logic changes.
- Use Expo config/plugins and app config (`app.config.ts`) when platform configuration is required.
- For production build flows, follow existing EAS scripts and workflows.

## Environment and Config

- Use `EXPO_PUBLIC_*` prefix for variables required by app runtime.
- Update `env.ts` and related config files rather than hardcoding environment values.

## Responses

When giving responses and summaries be concise and short.

## Plans

When creating implementation plans:

- Make plans concise and actionable - sacrifice grammar for concision when needed
- Cite specific file paths and essential code snippets
- Break down complex tasks into logical, testable steps
- Consider dependencies between packages and modules
- Plan for testing, error handling, and edge cases
- At the end of each plan, list any unresolved questions that need clarification
- Keep plans proportional to request complexity - don't over-engineer simple tasks

---

Use this file for concise rules and commands; keep deep reference material in canonical docs.
