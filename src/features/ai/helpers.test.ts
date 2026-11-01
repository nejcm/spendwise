import { resolveScopeAccounts, toggleScopeAccount } from './helpers';

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
