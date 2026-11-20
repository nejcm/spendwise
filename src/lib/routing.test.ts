import { extractExpoPathFromURL } from 'expo-router/build/fork/extractPathFromURL';
import { appSchemeUrlToPath } from './routing';

function routerSearchParams(url: string) {
  const path = extractExpoPathFromURL([], appSchemeUrlToPath(url, 'spendwise'));
  return new URL(path, 'https://x/').searchParams;
}

describe('appSchemeUrlToPath', () => {
  it('keeps encoded delimiters inside query values through Expo Router path extraction', () => {
    const params = routerSearchParams('spendwise://transactions/new?amount=12%2C50%20%E2%82%AC&merchant_name=Coffee%20%26%20Co%20%231%20C%2B%2B&currency=EUR');
    expect(params.get('amount')).toBe('12,50 €');
    expect(params.get('merchant_name')).toBe('Coffee & Co #1 C++');
    expect(params.get('currency')).toBe('EUR');
  });

  it('leaves other schemes untouched', () => {
    expect(appSchemeUrlToPath('exp+spendwise://expo-development-client/?url=x', 'spendwise')).toBe('exp+spendwise://expo-development-client/?url=x');
    expect(appSchemeUrlToPath('spendwise.preview://transactions/new?a=1', 'spendwise.preview')).toBe('/transactions/new?a=1');
  });
});
