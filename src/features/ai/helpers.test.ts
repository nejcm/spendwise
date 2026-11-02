import { isSameAccountScope, maskApiKey, resolveScopeAccounts, toggleScopeAccount } from './helpers';

const active = [{ id: 'a' }, { id: 'b' }];

describe('resolveScopeAccounts', () => {
  it('returns all active accounts for "all"', () => {
    expect(resolveScopeAccounts(active, 'all')).toEqual({ accounts: active, limited: false });
  });

  it('keeps picked active accounts and drops archived or deleted ones', () => {
    expect(resolveScopeAccounts(active, ['b', 'archived'])).toEqual({ accounts: [{ id: 'b' }], limited: true });
  });

  it('falls back to all when no picked account is active anymore', () => {
    expect(resolveScopeAccounts(active, ['archived'])).toEqual({ accounts: active, limited: false });
  });

  it('is not limited when every active account is picked', () => {
    expect(resolveScopeAccounts(active, ['a', 'b']).limited).toBe(false);
  });
});

describe('toggleScopeAccount', () => {
  it('adds to and removes from the pick, returning "all" when empty', () => {
    expect(toggleScopeAccount('all', 'a')).toEqual(['a']);
    expect(toggleScopeAccount(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleScopeAccount(['a'], 'a')).toBe('all');
  });
});

describe('isSameAccountScope', () => {
  it('compares the resolved accounts, not the raw pick', () => {
    expect(isSameAccountScope(active, 'all', ['a', 'b'])).toBe(true);
    expect(isSameAccountScope(active, ['b', 'a', 'archived'], ['a', 'b'])).toBe(true);
    expect(isSameAccountScope(active, ['a'], ['a'])).toBe(true);
    expect(isSameAccountScope(active, 'all', ['a'])).toBe(false);
    expect(isSameAccountScope(active, ['a'], ['b'])).toBe(false);
  });
});

describe('maskApiKey', () => {
  it('keeps the sk- prefix and the last four characters', () => {
    expect(maskApiKey(' sk-proj-abcdefghij4f2a ')).toBe('sk-••••••••4f2a');
    expect(maskApiKey('anthropic-key-1234')).toBe('••••••••1234');
  });

  it('hides short keys completely', () => {
    expect(maskApiKey('sk-short')).toBe('••••••••');
  });
});
