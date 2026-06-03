import type { ImperativeRouter } from 'expo-router';
import { Linking } from 'react-native';

export function goBackOrFallback(router: ImperativeRouter, fallbackHref?: Parameters<ImperativeRouter['replace']>[0]) {
  if (router.canGoBack()) return router.back();
  return router.replace(fallbackHref ?? '/');
}

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}
