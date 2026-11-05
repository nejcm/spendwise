import type { ImperativeRouter } from 'expo-router';

export function goBackOrFallback(router: ImperativeRouter, fallbackHref?: Parameters<ImperativeRouter['replace']>[0]) {
  if (router.canGoBack()) return router.back();
  return router.replace(fallbackHref ?? '/');
}
