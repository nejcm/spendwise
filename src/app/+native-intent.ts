import Env from 'env';
import { newTransactionLinkToPath } from '@/lib/routing';

let linkCount = 0;

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return newTransactionLinkToPath(path, Env.EXPO_PUBLIC_SCHEME, `${Date.now().toString(36)}-${++linkCount}`);
}
