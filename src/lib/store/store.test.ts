import { selectIsAiEnabled, useAppStore } from './store';

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
