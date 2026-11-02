import { storage } from '@/lib/storage';
import { clearAppStore, selectIsAiEnabled, selectIsAiFeatureOn, setLastPrimaryTabPath, setMonthStartDay, setPeriodSelection, useAppStore } from './store';

describe('app store selectors', () => {
  it('enables AI only when the active provider has a saved key', () => {
    const baseState = useAppStore.getState();

    expect(selectIsAiEnabled({
      ...baseState,
      aiProvider: 'openai',
      openaiApiKey: 'sk-openai',
      anthropicApiKey: undefined,
    })).toBe(true);
    expect(selectIsAiEnabled({
      ...baseState,
      aiProvider: 'openai',
      openaiApiKey: undefined,
      anthropicApiKey: 'sk-anthropic',
    })).toBe(false);
    expect(selectIsAiEnabled({
      ...baseState,
      aiProvider: 'anthropic',
      openaiApiKey: 'sk-openai',
      anthropicApiKey: '   ',
    })).toBe(false);
  });

  it('treats an AI feature as on until it is switched off, and off without a key', () => {
    const withKey = { ...useAppStore.getState(), aiProvider: 'openai' as const, openaiApiKey: 'sk-openai' };

    expect(selectIsAiFeatureOn('scan')(withKey)).toBe(true);
    expect(selectIsAiFeatureOn('scan')({ ...withKey, aiFeatures: { chat: false } })).toBe(true);
    expect(selectIsAiFeatureOn('chat')({ ...withKey, aiFeatures: { chat: false } })).toBe(false);
    expect(selectIsAiFeatureOn('chat')({ ...withKey, openaiApiKey: undefined })).toBe(false);
  });
});

describe('app store actions', () => {
  beforeEach(() => {
    clearAppStore();
    jest.mocked(storage.set).mockClear();
    jest.mocked(storage.getString).mockReset();
  });

  it('uses the new-install defaults', () => {
    const state = useAppStore.getState();
    expect(state.homeScreenChart).toBe('balance');
    expect(state.openTxOnCreate).toBe(false);
    expect(state.notifications).toMatchObject({ upcomingBillsDays: 1, lowBalance: true, lowBalanceThresholdCents: 10000 });
    expect(state.autoBackup.retention).toBe(5);
  });

  it('stores the last primary tab path', () => {
    setLastPrimaryTabPath('/transactions');
    expect(useAppStore.getState().lastPrimaryTabPath).toBe('/transactions');
  });

  it('restores the selected Period', async () => {
    setPeriodSelection({ mode: 'today' });
    const persisted = jest.mocked(storage.set).mock.calls.at(-1)?.[1] as string;

    clearAppStore();
    jest.mocked(storage.getString).mockReturnValue(persisted);
    await useAppStore.persist.rehydrate();

    expect(useAppStore.getState().periodSelection).toEqual({ mode: 'today' });
  });

  it('keeps the current month selected when the month start day moves', () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 2, 12) });
    setPeriodSelection({ mode: 'month', year: 2026, month: 11 });
    setMonthStartDay(25);
    expect(useAppStore.getState().periodSelection).toEqual({ mode: 'month', year: 2026, month: 10 });

    setPeriodSelection({ mode: 'month', year: 2026, month: 3 });
    setMonthStartDay(1);
    expect(useAppStore.getState().periodSelection).toEqual({ mode: 'month', year: 2026, month: 3 });
    jest.useRealTimers();
  });
});

describe('app store persist migration', () => {
  beforeEach(() => {
    clearAppStore();
    jest.mocked(storage.getString).mockReset();
  });

  async function rehydrateFrom(state: Record<string, unknown>, version: number) {
    jest.mocked(storage.getString).mockReturnValue(JSON.stringify({ state, version }));
    await useAppStore.persist.rehydrate();
    return useAppStore.getState();
  }

  const v1Notifications = {
    budgetAlerts: false,
    recommendations: true,
    upcomingBills: true,
    upcomingBillsDays: 7,
    lowBalance: false,
    lowBalanceThresholdCents: 5000,
    weeklyDigest: false,
  };
  const v1AutoBackup = { enabled: true, interval: 'weekly', lastAutoBackupAt: null };

  it('maps monthly_spending to balance and keeps every other v1 preference', async () => {
    const state = await rehydrateFrom({
      homeScreenChart: 'monthly_spending',
      isFirstTime: false,
      openaiApiKey: 'sk-openai',
      anthropicApiKey: 'sk-anthropic',
      aiProvider: 'anthropic',
      openTxOnCreate: true,
      notifications: v1Notifications,
      autoBackup: v1AutoBackup,
      currency: 'CHF',
    }, 1);

    expect(state.homeScreenChart).toBe('balance');
    expect(state.isFirstTime).toBe(false);
    expect(state.openaiApiKey).toBe('sk-openai');
    expect(state.anthropicApiKey).toBe('sk-anthropic');
    expect(state.aiProvider).toBe('anthropic');
    expect(state.openTxOnCreate).toBe(true);
    expect(state.notifications).toEqual(v1Notifications);
    expect(state.autoBackup).toEqual(v1AutoBackup);
    expect(state.currency).toBe('CHF');
  });

  it('keeps persisted v2 notification settings instead of the new-install defaults', async () => {
    const state = await rehydrateFrom({ notifications: { global: true, budgetAlerts: false } }, 2);
    expect(state.notifications).toEqual({ global: true, budgetAlerts: false });
  });

  it('keeps a non-default v1 chart choice', async () => {
    expect((await rehydrateFrom({ homeScreenChart: 'category_spending' }, 1)).homeScreenChart).toBe('category_spending');
    expect((await rehydrateFrom({ homeScreenChart: 'none' }, 1)).homeScreenChart).toBe('none');
  });

  it('keeps the old openTxOnCreate default for v1 state saved before the key existed', async () => {
    expect((await rehydrateFrom({ isFirstTime: false }, 1)).openTxOnCreate).toBe(true);
    expect((await rehydrateFrom({ openTxOnCreate: false }, 1)).openTxOnCreate).toBe(false);
  });
});
