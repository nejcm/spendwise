# Release

## Build Profiles

EAS profiles are defined in `eas.json`.

- `development`: internal development client builds
- `preview`: preview/store-distributed QA builds
- `production`: store builds with auto-incrementing versioning
- `simulator`: development-oriented simulator profile

## Common Commands

```bash
pnpm build:development:ios
pnpm build:development:android
pnpm build:preview:ios
pnpm build:preview:android
pnpm build:production:ios
pnpm build:production:android
```

## Environment Selection

Each profile sets `EXPO_PUBLIC_APP_ENV` for the appropriate environment. Use the matching `start:*`, `ios:*`, `android:*`, and `prebuild:*` helpers during local prep when needed.

## Release Checklist

1. Run `pnpm verify`
2. Confirm env/config changes are intentional
3. Confirm migrations are safe for existing installs
4. Confirm route changes and navigation flows work on target platforms
5. Build the correct EAS profile

## Platform Notes

- Prefer Expo config and plugins over direct native project edits
- Keep bundle/package identifiers derived through `env.ts`
- Non-production builds currently include app-icon badges when allowed
