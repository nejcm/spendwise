import type { ChatMessage } from '@/features/ai/service';

import {
  appendAiMessage,
  clearAiChat,
  MAX_PERSISTED_AI_CHARACTERS,
  MAX_PERSISTED_AI_MESSAGES,
  resetAiChatStore,
  setAiDraftQuestion,
  setAiMessages,
  trimPersistedMessages,
  useAiChatStore,
} from './store';

function createMessage(id: string, content: string): ChatMessage {
  return {
    id,
    role: 'user',
    content,
  };
}

describe('ai store', () => {
  beforeEach(() => {
    resetAiChatStore();
  });

  it('keeps only the most recent persisted messages up to the count limit', () => {
    const messages = Array.from(
      { length: MAX_PERSISTED_AI_MESSAGES + 5 },
      (_, index) => createMessage(`message-${index}`, `Question ${index}`),
    );

    setAiMessages(messages);

    expect(useAiChatStore.getState().messages).toHaveLength(MAX_PERSISTED_AI_MESSAGES);
    expect(useAiChatStore.getState().messages[0]?.id).toBe('message-5');
    expect(useAiChatStore.getState().messages.at(-1)?.id).toBe(`message-${MAX_PERSISTED_AI_MESSAGES + 4}`);
  });

  it('trims oldest messages when total transcript size exceeds the character limit', () => {
    const oversizedChunk = 'x'.repeat(Math.floor(MAX_PERSISTED_AI_CHARACTERS / 2));

    expect(trimPersistedMessages([
      createMessage('oldest', oversizedChunk),
      createMessage('middle', oversizedChunk),
      createMessage('latest', oversizedChunk),
    ])).toEqual([
      createMessage('middle', oversizedChunk),
      createMessage('latest', oversizedChunk),
    ]);
  });

  it('truncates a single oversized message to the character limit', () => {
    const oversizedMessage = createMessage('latest', 'x'.repeat(MAX_PERSISTED_AI_CHARACTERS + 25));

    expect(trimPersistedMessages([oversizedMessage])).toEqual([
      createMessage('latest', 'x'.repeat(MAX_PERSISTED_AI_CHARACTERS)),
    ]);
  });

  it('clears the persisted transcript and draft together', () => {
    setAiDraftQuestion('What changed this month?');
    appendAiMessage(createMessage('message-1', 'Show my latest expenses.'));
    clearAiChat();

    expect(useAiChatStore.getState().messages).toEqual([]);
    expect(useAiChatStore.getState().draftQuestion).toBe('');
    expect(useAiChatStore.getState().lastUpdatedAt).toBeNull();
  });
});
