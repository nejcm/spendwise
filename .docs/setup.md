# Setup

## Requirements

- Node.js 20+
- `pnpm`
- Expo tooling for local device/web development
- EAS CLI for cloud builds

## Install

```bash
pnpm install
```

## Environment

Create a local `.env` from `.env.example`.

```bash
cp .env.example .env
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
```

Current env schema lives in `env.ts`.

### Required values

```dotenv
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=https://example.com
EXPO_PUBLIC_VAR_NUMBER=0
EXPO_PUBLIC_VAR_BOOL=false
```

### Optional values

```dotenv
APP_BUILD_ONLY_VAR=
```

If `EXPO_PUBLIC_ASSOCIATED_DOMAIN` is not used, leave it out entirely. Do not set it to an empty string because strict env validation expects either a valid URL or no value.

### Derived values

These are computed in `env.ts` and should not usually be overridden in `.env`:

- `EXPO_PUBLIC_NAME`
- `EXPO_PUBLIC_SCHEME`
- `EXPO_PUBLIC_BUNDLE_ID`
- `EXPO_PUBLIC_PACKAGE`
- `EXPO_PUBLIC_VERSION`

## Run The App

```bash
pnpm start
pnpm ios
pnpm android
pnpm web
```

## Environment Modes

- `development`: local work and development builds
- `preview`: QA / preview distribution
- `production`: store builds

Helpers:

```bash
pnpm start:preview
pnpm start:production
pnpm ios:preview
pnpm ios:production
pnpm android:preview
pnpm android:production
```

## Quality Checks

```bash
pnpm lint
pnpm lint:ts
pnpm lint:all
pnpm test
pnpm verify
pnpm doctor
pnpm knip
```

## Notes

- The app is local-first, but the env schema still requires `EXPO_PUBLIC_API_URL`.
- AI provider keys are not configured through `.env`; users enter them in-app and they are stored locally.
- `pnpm install-maestro` uses a shell installer and may need a Bash-compatible environment.
