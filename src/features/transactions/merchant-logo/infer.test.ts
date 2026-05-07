import { inferMerchantLogoSlug } from './infer';

describe('inferMerchantLogoSlug', () => {
  it('matches rules from merchant_name', () => {
    expect(inferMerchantLogoSlug({ merchant_name: 'NETFLIX.COM', note: null })).toBe('netflix');
    expect(inferMerchantLogoSlug({ merchant_name: 'Spotify AB', note: null })).toBe('spotify');
    expect(inferMerchantLogoSlug({ merchant_name: 'SBUX #1234', note: null })).toBe('starbucks');
  });

  it('matches rules from note when merchant is missing', () => {
    expect(inferMerchantLogoSlug({ merchant_name: null, note: 'Paid netflix subscription' })).toBe('netflix');
  });

  it('falls back to a derived slug', () => {
    expect(inferMerchantLogoSlug({ merchant_name: 'Starbucks Coffee', note: null })).toBe('starbucks');
  });

  it('returns null when no inputs exist', () => {
    expect(inferMerchantLogoSlug({ merchant_name: null, note: null })).toBeNull();
    expect(inferMerchantLogoSlug({})).toBeNull();
  });
});
