import { isShareExtensionUrl } from '@/features/ai/share-intent';

// Share payloads are read by useShareIntent, not routed.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (isShareExtensionUrl(path)) return initial ? '/' : null;
  return path;
}
