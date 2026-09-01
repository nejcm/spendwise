import type { ExpoConfig } from '@expo/config';

import { withAppBuildGradle, withGradleProperties } from 'expo/config-plugins';

// Gradle properties injected on every prebuild.
// - jvmargs: prebuild/EAS builds OOM with the Gradle default heap.
// - optimizedResourceShrinking: R8's optimized resource shrinker. Not on by
//   default until AGP 9, and Play Console flags its absence as a missing
//   optimization. Drop this once Expo ships AGP 9+.
export const GRADLE_PROPERTIES: Record<string, string> = {
  'org.gradle.jvmargs': '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError',
  'android.r8.optimizedResourceShrinking': 'true',
};

// Match the call expression, not the bare filename: a loose match would also
// rewrite comments or another build type, and a loose "already optimized?"
// check would skip a release block that still needs rewriting.
const DEFAULT_PROGUARD_FILE = /getDefaultProguardFile\((["'])proguard-android\.txt\1\)/g;
const OPTIMIZED_PROGUARD_FILE = 'getDefaultProguardFile("proguard-android-optimize.txt")';

/**
 * Expo's Android template pairs `minifyEnabled` with AGP's `proguard-android.txt`,
 * which carries `-dontoptimize` — so R8 shrinks and obfuscates but never runs its
 * optimization passes, which is what Play Console reports as "Optimization isn't
 * enabled". `proguard-android-optimize.txt` is the same file with those passes on.
 *
 * Throws when neither file is referenced, so an Expo upgrade that reshapes the
 * template fails the build instead of silently dropping the optimization.
 */
export function rewriteProguardFile(contents: string): string {
  const rewritten = contents.replace(DEFAULT_PROGUARD_FILE, OPTIMIZED_PROGUARD_FILE);
  if (rewritten === contents && !contents.includes('proguard-android-optimize.txt')) {
    throw new Error(
      'rewriteProguardFile: no getDefaultProguardFile("proguard-android.txt") in android/app/build.gradle - Expo\'s template changed, update plugins/android-build.ts',
    );
  }
  return rewritten;
}

export function withGradleProps(cfg: ExpoConfig): ExpoConfig {
  return withGradleProperties(cfg, (gradleConfig) => {
    for (const [key, value] of Object.entries(GRADLE_PROPERTIES)) {
      const existing = gradleConfig.modResults.find(
        (item) => item.type === 'property' && item.key === key,
      );
      if (existing && existing.type === 'property') {
        existing.value = value;
      }
      else {
        gradleConfig.modResults.push({ type: 'property', key, value });
      }
    }
    return gradleConfig;
  });
}

export function withR8Optimization(cfg: ExpoConfig): ExpoConfig {
  return withAppBuildGradle(cfg, (gradleConfig) => {
    gradleConfig.modResults.contents = rewriteProguardFile(gradleConfig.modResults.contents);
    return gradleConfig;
  });
}
