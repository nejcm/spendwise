import type { ImperativeRouter } from 'expo-router';

export function goBackOrFallback(router: ImperativeRouter, fallbackHref?: Parameters<ImperativeRouter['replace']>[0]) {
  if (router.canGoBack()) return router.back();
  return router.replace(fallbackHref ?? '/');
}

// Expo Router decodes query values and re-joins them unescaped, so `&` or `#` inside a value splits it; a bare path skips that step.
export function appSchemeUrlToPath(url: string, scheme: string) {
  const prefix = `${scheme}://`;
  return url.startsWith(prefix) ? `/${url.slice(prefix.length)}` : url;
}
