import type { Router } from 'expo-router';

export function goBackOrFallback(router: Router, fallbackHref: Parameters<Router['replace']>[0]) {
  if (router.canGoBack()) return router.back();
  return router.replace(fallbackHref);
}
