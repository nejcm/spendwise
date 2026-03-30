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
pnpm knip:check
```

## Notes

- The app is local-first, but the env schema still requires `EXPO_PUBLIC_API_URL`.
- AI provider keys are not configured through `.env`; users enter them in-app and they are stored locally.
- `pnpm install-maestro` uses a shell installer and may need a Bash-compatible environment.

## Windows: Android Native Build (Long Paths)

`react-native-keyboard-controller` produces CMake object file paths ~358 chars long, exceeding the Windows 260-char MAX_PATH limit. Symptom: `ninja: error: Filename longer than 260 characters` during `pnpm android`.

The registry `LongPathsEnabled` key alone is not enough — the `ninja.exe` bundled with Android SDK CMake 3.22.1 was not compiled with the Windows `LongPathAware` manifest and ignores the setting. Replace it with Ninja ≥ 1.12.

**Fix: replace the bundled Ninja**

1. Download `ninja-win.zip` from <https://github.com/ninja-build/ninja/releases> and extract `ninja.exe`.
2. Back up and replace:
   ```
   copy "%LOCALAPPDATA%\Android\Sdk\cmake\3.22.1\bin\ninja.exe" "%LOCALAPPDATA%\Android\Sdk\cmake\3.22.1\bin\ninja.exe.bak"
   copy ninja.exe "%LOCALAPPDATA%\Android\Sdk\cmake\3.22.1\bin\ninja.exe"
   ```
3. Ensure the long-path registry key is set (run as Administrator, one-time):
   ```powershell
   reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
   git config --system core.longpaths true
   ```
4. Reboot, wipe the CMake cache, then rebuild:
   ```
   rmdir /s /q android\app\.cxx
   rmdir /s /q android\app\build
   pnpm android
   ```

**Alternative:** Install CMake 3.28+ via Android Studio → SDK Manager → SDK Tools → CMake. Newer CMake bundles a long-path-aware Ninja. Then point to it in `android/local.properties`:

```
cmake.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk\\cmake\\3.28.x.x
```

**Last resort:** Move or junction the project to a shorter path (e.g. `C:\sw`).
