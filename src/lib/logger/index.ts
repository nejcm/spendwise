import type { AppEnv } from '@/../env';
import Env from '@/../env';

export const logger = {
  withEnv: (env: AppEnv | AppEnv[]) => {
    if (Array.isArray(env) ? !env.includes(Env.EXPO_PUBLIC_APP_ENV) : env !== Env.EXPO_PUBLIC_APP_ENV) return undefined;
    else return console;
  },
};
