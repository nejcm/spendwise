import { countNotificationsOn, isNotificationOn, toggleNotification } from './helpers';

const defaults = { budgetAlerts: true, recommendations: true, upcomingBills: true, upcomingBillsDays: 1 as const, lowBalance: true, weeklyDigest: false };

describe('isNotificationOn', () => {
  it('is off for every type until the user has opted in', () => {
    expect(isNotificationOn(defaults, 'budgetAlerts')).toBe(false);
    expect(isNotificationOn({ ...defaults, global: true }, 'budgetAlerts')).toBe(true);
  });

  it('matches the checks for missing keys', () => {
    expect(isNotificationOn({ global: true }, 'upcomingBills')).toBe(true);
    expect(isNotificationOn({ global: true }, 'lowBalance')).toBe(false);
    expect(isNotificationOn({ global: true }, 'weeklyDigest')).toBe(false);
  });
});

describe('toggleNotification', () => {
  it('opts in on the first toggle-on and leaves only that type on', () => {
    expect(toggleNotification(defaults, 'lowBalance', true)).toEqual({
      global: true,
      upcomingBills: false,
      budgetAlerts: false,
      lowBalance: true,
      weeklyDigest: false,
      recommendations: false,
    });
  });

  it('changes only the toggled type once opted in', () => {
    expect(toggleNotification({ ...defaults, global: true }, 'weeklyDigest', true)).toEqual({ weeklyDigest: true });
    expect(toggleNotification({ ...defaults, global: true }, 'budgetAlerts', false)).toEqual({ budgetAlerts: false });
  });

  it('turning off never opts in', () => {
    expect(toggleNotification(defaults, 'budgetAlerts', false)).toEqual({ budgetAlerts: false });
  });
});

describe('countNotificationsOn', () => {
  it('counts the visible toggles that are on', () => {
    expect(countNotificationsOn({ ...defaults, global: true }, true)).toBe(4);
    expect(countNotificationsOn({ ...defaults, global: true }, false)).toBe(3);
    expect(countNotificationsOn(defaults, true)).toBe(0);
  });
});
