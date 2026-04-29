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

## Android Local EAS Troubleshooting

### Corrupt Gradle Groovy DSL Cache

Symptom:

```text
Could not read workspace metadata from ~/.gradle/caches/8.14.3/groovy-dsl/.../metadata.bin
metadata.bin (No such file or directory)
```

Fix by stopping Gradle and clearing the Gradle version cache:

```bash
pkill -f GradleDaemon || true
rm -rf "$HOME/.gradle/caches/8.14.3"
rm -rf "$HOME/.gradle/daemon/8.14.3"
rm -rf /tmp/nejcm/eas-build-local-nodejs
```

Then retry the local build:

```bash
eas build -p android --local --clear-cache
```

If the same path keeps failing, check that `~/.gradle` and `~/.gradle/caches` are owned by the current user.

### Disk Quota Exceeded During Bundle Packaging

Symptom:

```text
Execution failed for task ':app:packageReleaseBundle'.
java.io.IOException: Disk quota exceeded
```

Local EAS builds default to `/tmp`, which may be a small tmpfs. Put both the EAS working directory and temp directory on a filesystem with enough free space:

```bash
rm -rf "$HOME/eas-local-builds/workdir"
mkdir -p "$HOME/eas-local-builds/workdir" "$HOME/eas-local-builds/tmp"

EAS_LOCAL_BUILD_WORKINGDIR="$HOME/eas-local-builds/workdir" \
TMPDIR="$HOME/eas-local-builds/tmp" \
eas build -p android --local --clear-cache
```

The EAS working directory must be empty before each run. If EAS reports `Workingdir is not empty`, clear only the workdir and retry:

```bash
rm -rf "$HOME/eas-local-builds/workdir"
mkdir -p "$HOME/eas-local-builds/workdir"
```

Useful disk checks:

```bash
df -h "$HOME" /tmp
df -ih "$HOME" /tmp
du -sh "$HOME/.gradle" "$HOME/.npm" "$HOME/.cache" /tmp/nejcm 2>/dev/null || true
```

### Local Build Log Safety

Do not paste full EAS local build plugin commands into public logs or issues. They can contain encoded Android signing credential material, including keystore and password fields. If such output is shared publicly, rotate the Android keystore in EAS.
