import type { AiPromptContext } from '../context';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type ProviderChatMessage = Pick<ChatMessage, 'role' | 'content'>;

export type AskInput = {
  messages: ChatMessage[];
  context?: AiPromptContext;
};
