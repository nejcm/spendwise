import { getShouldShowPersistentTabBar } from './persistent-tab-bar';

describe('getShouldShowPersistentTabBar', () => {
  it('hides the tab bar on full-screen modal routes', () => {
    expect(getShouldShowPersistentTabBar('/transactions/new')).toBe(false);
    expect(getShouldShowPersistentTabBar('/accounts/new')).toBe(false);
    expect(getShouldShowPersistentTabBar('/accounts/acc_1/edit')).toBe(false);
    expect(getShouldShowPersistentTabBar('/categories/new')).toBe(false);
    expect(getShouldShowPersistentTabBar('/categories/cat_1/edit')).toBe(false);
    expect(getShouldShowPersistentTabBar('/scheduled/new')).toBe(false);
    expect(getShouldShowPersistentTabBar('/stats/global-budget')).toBe(false);
  });

  it('keeps the tab bar on normal app routes', () => {
    expect(getShouldShowPersistentTabBar('/')).toBe(true);
    expect(getShouldShowPersistentTabBar('/transactions')).toBe(true);
    expect(getShouldShowPersistentTabBar('/accounts/acc_1')).toBe(true);
  });
});
