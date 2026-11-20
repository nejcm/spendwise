import type { ImperativeRouter } from 'expo-router';

export function goBackOrFallback(router: ImperativeRouter, fallbackHref?: Parameters<ImperativeRouter['replace']>[0]) {
  if (router.canGoBack()) return router.back();
  return router.replace(fallbackHref ?? '/');
}

const NEW_TRANSACTION_ROUTE = 'transactions/new';

// Expo Router decodes query values and re-joins them unescaped, so a bare path keeps `&`/`#` inside values.
// `link_id` makes every link a new event even when amount and merchant repeat.
export function newTransactionLinkToPath(url: string, scheme: string, linkId: string) {
  const prefix = `${scheme}://${NEW_TRANSACTION_ROUTE}`;
  const rest = url.slice(prefix.length);
  if (!url.startsWith(prefix) || (rest && !rest.startsWith('?'))) return url;
  return `/${NEW_TRANSACTION_ROUTE}${rest ? `${rest}&` : '?'}link_id=${linkId}`;
}

export function singleValueParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}
