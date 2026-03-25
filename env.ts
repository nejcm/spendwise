import z from 'zod';

import packageJSON from './package.json';

const APP_ENV_VALUES = ['development', 'preview', 'production'] as const;
type AppEnv = (typeof APP_ENV_VALUES)[number];

function resolveAppEnv(): AppEnv {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  if (raw && APP_ENV_VALUES.includes(raw as AppEnv)) {
    return raw as AppEnv;
  }
  return 'development';
}

const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']),
  EXPO_PUBLIC_NAME: z.string(),
  EXPO_PUBLIC_SCHEME: z.string(),
  EXPO_PUBLIC_BUNDLE_ID: z.string(),
  EXPO_PUBLIC_PACKAGE: z.string(),
  EXPO_PUBLIC_VERSION: z.string(),
});

const EXPO_PUBLIC_APP_ENV = resolveAppEnv();

const BUNDLE_IDS = {
  development: 'com.nejcm.spendwise.development',
  preview: 'com.nejcm.spendwise.preview',
  production: 'com.nejcm.spendwise',
} as const;

const PACKAGES = {
  development: 'com.nejcm.spendwise.development',
  preview: 'com.nejcm.spendwise.preview',
  production: 'com.nejcm.spendwise',
} as const;

const SCHEMES = {
  development: 'spendwise',
  preview: 'spendwise.preview',
  production: 'spendwise',
} as const;

const NAME = 'spendwise';

// Check if strict validation is required (before prebuild)
const STRICT_ENV_VALIDATION = process.env.STRICT_ENV_VALIDATION === '1';

// Build env object
const _env: z.infer<typeof envSchema> = {
  EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_NAME: NAME,
  EXPO_PUBLIC_SCHEME: SCHEMES[EXPO_PUBLIC_APP_ENV],
  EXPO_PUBLIC_BUNDLE_ID: BUNDLE_IDS[EXPO_PUBLIC_APP_ENV],
  EXPO_PUBLIC_PACKAGE: PACKAGES[EXPO_PUBLIC_APP_ENV],
  EXPO_PUBLIC_VERSION: packageJSON.version,
};

function getValidatedEnv(env: z.infer<typeof envSchema>) {
  const parsed = envSchema.safeParse(env);

  if (parsed.success === false) {
    const errorMessage
      = `❌ Invalid environment variables:${JSON.stringify(
        parsed.error.flatten().fieldErrors,
        null,
        2,
      )}\n❌ Missing variables in .env file for APP_ENV=${EXPO_PUBLIC_APP_ENV}`
      + `\n💡 Tip: If you recently updated the .env file, try restarting with -c flag to clear the cache.`;

    if (STRICT_ENV_VALIDATION) {
      console.error(errorMessage);
      throw new Error('Invalid environment variables');
    }
  }
  else {
    console.log('✅ Environment variables validated successfully');
  }

  return parsed.success ? parsed.data : env;
}

const Env = STRICT_ENV_VALIDATION ? getValidatedEnv(_env) : _env;

export default Env;
