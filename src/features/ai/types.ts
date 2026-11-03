import type { RefObject } from 'react';
import type { FlatList, LayoutChangeEvent } from 'react-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { ScheduledTransactionFormData } from '@/features/scheduled-transactions/types';
import type { TransactionWithCategory } from '@/features/transactions/types';
import type { PeriodSelection } from '@/lib/store/store';

export type AiProviderType = 'openai' | 'anthropic';

export type ChatMessage = {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly createdAt?: number;
};

/** Focus period (soft, a default for the model) and accounts (strict filter on tool data). */
export type AiScope = {
  readonly period: PeriodSelection;
  readonly accountIds: readonly string[] | 'all';
};

export type MessageRenderInfo = {
  readonly displayContent: string;
  readonly isLiveStreaming: boolean;
  readonly pendingWrite: WriteAction | null;
};

export type ChatActions = {
  readonly send: (text?: string) => void;
  readonly setDraft: (text: string) => void;
  readonly reset: () => void;
  readonly applyScope: (scope: AiScope, accountsChanged: boolean) => void;
  readonly confirmWrite: () => void;
  readonly cancelWrite: () => void;
};

export type ChatScrollHandlers = {
  readonly scrollViewRef: RefObject<FlatList<ChatMessage> | null>;
  readonly onContentSizeChange: () => void;
  readonly onScrollViewLayout: (event: LayoutChangeEvent) => void;
  readonly onMessageLayout: (messageId: string, event: LayoutChangeEvent) => void;
  readonly shouldShowBottomFiller: boolean;
  readonly bottomFillerHeight: number;
};

export type UseChatReturn = {
  readonly hasKey: boolean;
  readonly isChatOn: boolean;
  readonly messages: readonly ChatMessage[];
  readonly draftQuestion: string;
  readonly isStreaming: boolean;
  readonly streamedAssistantContent: string;
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

export type RecategorizedTransaction = Pick<TransactionWithCategory, 'id' | 'date' | 'amount' | 'currency' | 'account_name' | 'category_name'>;

/** A change the model proposed; written only after the user confirms it. Names are resolved for display. */
export type WriteAction
  = | { readonly tool: 'set_category_budget'; readonly categoryId: string; readonly categoryName: string; readonly budget: number | null; readonly previousBudget: number | null }
    | { readonly tool: 'recategorize_transactions'; readonly transactions: readonly RecategorizedTransaction[]; readonly categoryId: string; readonly categoryName: string }
    | { readonly tool: 'create_recurring_rule'; readonly rule: ScheduledTransactionFormData; readonly amount: number; readonly accountName: string; readonly categoryName: string };

export type StreamResponse
  = { readonly type: 'text'; readonly content: string }
    | { readonly type: 'tool_calls'; readonly content: string; readonly calls: readonly ToolCall[] };
