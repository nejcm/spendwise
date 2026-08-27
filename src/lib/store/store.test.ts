import { storage } from '@/lib/storage';
import { clearAppStore, selectIsAiEnabled, setLastPrimaryTabPath, setPeriodSelection, useAppStore } from './store';

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
});

describe('app store actions', () => {
  beforeEach(() => {
    clearAppStore();
    jest.mocked(storage.set).mockClear();
    jest.mocked(storage.getString).mockReset();
  });

  it('shows monthly spending on the home screen by default', () => {
    expect(useAppStore.getState().homeScreenChart).toBe('monthly_spending');
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
});
