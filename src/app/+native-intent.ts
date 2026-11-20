import Env from 'env';
import { appSchemeUrlToPath } from '@/lib/routing';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return appSchemeUrlToPath(path, Env.EXPO_PUBLIC_SCHEME);
}
