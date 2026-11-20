import Env from 'env';
import { newTransactionLinkToPath } from '@/lib/routing';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return newTransactionLinkToPath(path, Env.EXPO_PUBLIC_SCHEME, Date.now().toString(36));
}
