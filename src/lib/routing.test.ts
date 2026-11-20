import Env from 'env';
import { extractExpoPathFromURL } from 'expo-router/build/fork/extractPathFromURL';
import { redirectSystemPath } from '@/app/+native-intent';
import { newTransactionLinkToPath, singleValueParams } from './routing';

function routerSearchParams(url: string) {
  const path = extractExpoPathFromURL([], newTransactionLinkToPath(url, 'spendwise', 'id1'));
  return new URL(path, 'https://x/').searchParams;
}

describe('newTransactionLinkToPath', () => {
  it('keeps encoded delimiters inside query values through Expo Router path extraction', () => {
    const params = routerSearchParams('spendwise://transactions/new?amount=12%2C50%20%E2%82%AC&merchant_name=Coffee%20%26%20Co%20%231%20C%2B%2B&currency=EUR');
    expect(params.get('amount')).toBe('12,50 €');
    expect(params.get('merchant_name')).toBe('Coffee & Co #1 C++');
    expect(params.get('currency')).toBe('EUR');
    expect(params.get('link_id')).toBe('id1');
  });

  it('gives identical links distinct ids within the same millisecond', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const url = `${Env.EXPO_PUBLIC_SCHEME}://transactions/new?amount=5&merchant_name=Bakery`;
    const first = redirectSystemPath({ path: url, initial: false });
    const second = redirectSystemPath({ path: url, initial: false });
    jest.restoreAllMocks();
    expect(first).toMatch(/link_id=/);
    expect(first).not.toBe(second);
    expect(newTransactionLinkToPath('spendwise.preview://transactions/new', 'spendwise.preview', 'a')).toBe('/transactions/new?link_id=a');
  });

  it.each([
    'spendwise://expo-development-client/?url=http%3A%2F%2F10.0.0.2%3A8081',
    'exp+spendwise://expo-development-client/?url=x',
    'spendwise://transactions/newer?amount=5',
    'spendwise://transactions/abc',
    'spendwise://',
    'https://example.com/transactions/new?amount=5',
  ])('leaves %s untouched', (url: string) => {
    expect(newTransactionLinkToPath(url, 'spendwise', 'a')).toBe(url);
  });
});

describe('singleValueParams', () => {
  it('drops repeated and missing params', () => {
    expect(singleValueParams({ amount: ['12', '34'], merchant_name: 'Bakery', note: undefined })).toEqual({ merchant_name: 'Bakery' });
  });
});
