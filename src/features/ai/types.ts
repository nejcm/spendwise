import type { RefObject } from 'react';
import type { LayoutChangeEvent, ScrollView as RNScrollView } from 'react-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { AiPromptContext } from './context';

export type ChatMessage = {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
};

export type MessageRenderInfo = {
  readonly displayContent: string;
  readonly isLiveStreaming: boolean;
};

export type ChatActions = {
  readonly send: (text?: string) => void;
  readonly setDraft: (text: string) => void;
  readonly reset: () => void;
};

export type ChatScrollHandlers = {
  readonly scrollViewRef: RefObject<RNScrollView | null>;
  readonly onScrollViewLayout: (event: LayoutChangeEvent) => void;
  readonly onMessageLayout: (messageId: string, event: LayoutChangeEvent) => void;
  readonly shouldShowBottomFiller: boolean;
  readonly bottomFillerHeight: number;
};

export type UseChatReturn = {
  readonly hasKey: boolean;
  readonly messages: readonly ChatMessage[];
  readonly draftQuestion: string;
  readonly isStreaming: boolean;
  readonly errorMessage: string | null;
  readonly actions: ChatActions;
  readonly scroll: ChatScrollHandlers;
  readonly getMessageRenderInfo: (message: ChatMessage) => MessageRenderInfo;
  readonly markdownStyle: MarkdownStyle;
};

export type ProviderChatMessage = Pick<ChatMessage, 'role' | 'content'>;

export type AskInput = {
  messages: ChatMessage[];
  context?: AiPromptContext;
};
