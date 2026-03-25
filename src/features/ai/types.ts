import type { RefObject } from 'react';
import type { LayoutChangeEvent, ScrollView as RNScrollView } from 'react-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';

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
  readonly toolStatus: string | null;
  readonly actions: ChatActions;
  readonly scroll: ChatScrollHandlers;
  readonly getMessageRenderInfo: (message: ChatMessage) => MessageRenderInfo;
  readonly markdownStyle: MarkdownStyle;
};

// ─── Provider Message Types ───

export type ProviderChatMessage = {
  readonly role: 'user' | 'assistant';
  readonly content: string;
};

export type AskInput = {
  readonly messages: readonly ChatMessage[];
};

// ─── Tool Calling Types ───

export type ToolCall = {
  readonly id: string;
  readonly name: string;
  readonly arguments: Record<string, unknown>;
};

export type StreamResponse
  = { readonly type: 'text'; readonly content: string }
    | { readonly type: 'tool_calls'; readonly content: string; readonly calls: readonly ToolCall[] };
