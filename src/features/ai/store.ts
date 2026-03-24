import type { ChatMessage } from '@/features/ai/types';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createSelectors } from '@/lib/utils';
import { mmkvStorage } from '../../lib/storage';

export const MAX_PERSISTED_AI_MESSAGES = 50;
export const MAX_PERSISTED_AI_CHARACTERS = 24_000;

export type AiChatState = {
  messages: ChatMessage[];
  draftQuestion: string;
  lastUpdatedAt: number | null;
};

const defaultState: Pick<AiChatState, 'draftQuestion' | 'lastUpdatedAt' | 'messages'> = {
  messages: [],
  draftQuestion: '',
  lastUpdatedAt: null,
};

function getLastUpdatedAt(messages: ChatMessage[], draftQuestion: string) {
  return messages.length > 0 || draftQuestion.trim()
    ? Date.now()
    : null;
}

export function trimPersistedMessages(messages: ChatMessage[]) {
  const trimmedMessages = messages.slice(-MAX_PERSISTED_AI_MESSAGES);
  let totalCharacters = trimmedMessages.reduce((sum, message) => sum + message.content.length, 0);

  while (trimmedMessages.length > 1 && totalCharacters > MAX_PERSISTED_AI_CHARACTERS) {
    const removedMessage = trimmedMessages.shift();
    totalCharacters -= removedMessage?.content.length ?? 0;
  }

  if (trimmedMessages.length === 1 && totalCharacters > MAX_PERSISTED_AI_CHARACTERS) {
    const [message] = trimmedMessages;

    return [
      {
        ...message,
        content: message.content.slice(0, MAX_PERSISTED_AI_CHARACTERS),
      },
    ];
  }

  return trimmedMessages;
}

function buildPersistedState(messages: ChatMessage[], draftQuestion: string) {
  const nextMessages = trimPersistedMessages(messages);

  return {
    messages: nextMessages,
    draftQuestion,
    lastUpdatedAt: getLastUpdatedAt(nextMessages, draftQuestion),
  };
}

const _useAiChatStore = create<AiChatState>()(
  persist(
    () => ({
      ...defaultState,
    }),
    {
      name: 'ai-chat-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ messages, draftQuestion, lastUpdatedAt }) => ({
        messages,
        draftQuestion,
        lastUpdatedAt,
      }),
    },
  ),
);

export const useAiChatStore = createSelectors(_useAiChatStore);

export function setAiDraftQuestion(draftQuestion: string) {
  return _useAiChatStore.setState((state) => ({
    ...state,
    draftQuestion,
    lastUpdatedAt: getLastUpdatedAt(state.messages, draftQuestion),
  }));
}

export function appendAiMessage(message: ChatMessage) {
  return _useAiChatStore.setState((state) => ({
    ...state,
    ...buildPersistedState([...state.messages, message], state.draftQuestion),
  }));
}

export function setAiMessages(messages: ChatMessage[]) {
  return _useAiChatStore.setState((state) => ({
    ...state,
    ...buildPersistedState(messages, state.draftQuestion),
  }));
}

export function clearAiChat() {
  return _useAiChatStore.setState((state) => ({
    ...state,
    ...defaultState,
  }));
}

export function resetAiChatStore() {
  return _useAiChatStore.setState((state) => ({
    ...state,
    ...defaultState,
  }));
}
