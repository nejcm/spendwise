import { GRADLE_PROPERTIES, rewriteProguardFile } from './android-build';

// Verbatim from Expo SDK 57's templates/expo-template-bare-minimum/android/app/build.gradle.
const TEMPLATE_RELEASE_BLOCK = `
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
            shrinkResources enableShrinkResources.toBoolean()
            minifyEnabled enableMinifyInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
`;

describe('rewriteProguardFile', () => {
  it('swaps the default proguard file for the optimizing one', () => {
    expect(rewriteProguardFile(TEMPLATE_RELEASE_BLOCK)).toContain(
      'getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"',
    );
  });

  it('is idempotent on already-rewritten contents', () => {
    const once = rewriteProguardFile(TEMPLATE_RELEASE_BLOCK);
    expect(rewriteProguardFile(once)).toBe(once);
  });

  it('still rewrites release when the optimized name appears elsewhere', () => {
    // Regression: an `includes('proguard-android-optimize.txt')` early return
    // skipped a release block that was still on the un-optimized file.
    const withDecoyComment = `// see getDefaultProguardFile("proguard-android-optimize.txt")\n${TEMPLATE_RELEASE_BLOCK}`;
    const result = rewriteProguardFile(withDecoyComment);
    expect(result).not.toContain('getDefaultProguardFile("proguard-android.txt")');
  });

  it('leaves the bare filename alone outside a getDefaultProguardFile call', () => {
    // Regression: a global /proguard-android\.txt/ replace rewrote prose too.
    const result = rewriteProguardFile(
      `// proguard-android.txt disables optimization\n${TEMPLATE_RELEASE_BLOCK}`,
    );
    expect(result).toContain('// proguard-android.txt disables optimization');
  });

  it('does not touch other build types', () => {
    const result = rewriteProguardFile(TEMPLATE_RELEASE_BLOCK);
    expect(result).toContain('debug {\n            signingConfig signingConfigs.debug');
  });

  it('accepts single-quoted gradle strings', () => {
    const result = rewriteProguardFile(`proguardFiles getDefaultProguardFile('proguard-android.txt')`);
    expect(result).toBe('proguardFiles getDefaultProguardFile("proguard-android-optimize.txt")');
  });

  it('throws when the template references neither file', () => {
    expect(() => rewriteProguardFile('android { buildTypes { release { } } }')).toThrow(
      /Expo's template changed/,
    );
  });

  it('rewrites consistently across repeated calls', () => {
    // The module-level matcher is a /g regex; a stale lastIndex would make the
    // second call skip the first match.
    const first = rewriteProguardFile(TEMPLATE_RELEASE_BLOCK);
    const second = rewriteProguardFile(TEMPLATE_RELEASE_BLOCK);
    expect(second).toBe(first);
  });
});

describe('gRADLE_PROPERTIES', () => {
  it('enables optimized resource shrinking, which AGP 8 leaves off', () => {
    expect(GRADLE_PROPERTIES['android.r8.optimizedResourceShrinking']).toBe('true');
  });

  it('keeps the heap override that prebuild needs', () => {
    expect(GRADLE_PROPERTIES['org.gradle.jvmargs']).toContain('-Xmx4096m');
  });
});
