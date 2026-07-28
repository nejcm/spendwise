import { clearAppStore, selectIsAiEnabled, setLastPrimaryTabPath, useAppStore } from './store';

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
  });

  it('shows monthly spending on the home screen by default', () => {
    expect(useAppStore.getState().homeScreenChart).toBe('monthly_spending');
  });

  it('stores the last primary tab path', () => {
    setLastPrimaryTabPath('/transactions');
    expect(useAppStore.getState().lastPrimaryTabPath).toBe('/transactions');
  });
});
