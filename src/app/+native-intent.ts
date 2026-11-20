import Env from 'env';
import { isShareExtensionUrl } from '@/features/ai/share-intent';
import { newTransactionLinkToPath } from '@/lib/routing';

let linkCount = 0;

// Share payloads are read by useIncomingShare, not routed.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (isShareExtensionUrl(path)) return initial ? '/' : null;
  return newTransactionLinkToPath(path, Env.EXPO_PUBLIC_SCHEME, `${Date.now().toString(36)}-${++linkCount}`);
}
