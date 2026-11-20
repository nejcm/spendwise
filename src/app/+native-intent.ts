import { isShareExtensionUrl } from '@/features/ai/share-intent';

// The share payload is read by useShareIntent, not routed.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (!isShareExtensionUrl(path)) return path;
  return initial ? '/' : null;
}
