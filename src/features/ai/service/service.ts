import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { AiProviderType, AiScope, ChatMessage, ProviderChatMessage, ToolCall, WriteAction } from '../types';

import { AI_MAX_TOOL_ROUNDS } from '@/config';
import { getAccounts } from '@/features/accounts/queries';
import { translate } from '@/lib/i18n';
import { selectIsAiFeatureOn, useAppStore } from '@/lib/store/store';
import { resolveScopeAccounts } from '../helpers';
import {
  appendAnthropicToolCall,
  appendAnthropicToolResult,
  buildAnthropicMessages,
  streamAskAnthropic,
} from './anthropic';
import { buildSystemPrompt } from './constants';
import {
  appendOpenAiToolCall,
  appendOpenAiToolResult,
  buildOpenAiMessages,
  streamAskOpenAI,
} from './openai';
import { executeToolCall, executeWriteToolCall, getToolStatusMessage, isWriteTool } from './tool-executor';

function toProviderMessages(messages: readonly ChatMessage[]): ProviderChatMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

// Read before every provider call so removing the key or switching chat off stops a running tool loop.
function getChatKey(provider: AiProviderType) {
  const state = useAppStore.getState();
  const key = provider === 'anthropic' ? state.anthropicApiKey : state.openaiApiKey;
  if (state.aiProvider !== provider || !selectIsAiFeatureOn('chat')(state) || !key) throw new Error(translate('ai.unavailable'));
  return key;
}

// ─── Streaming with tool-call loop ───

type StreamAskWithToolsInput = {
  readonly messages: readonly ChatMessage[];
  readonly db: SQLiteDatabase;
  readonly queryClient: QueryClient;
  readonly scope: AiScope;
  /** Resolves true only when the user confirms the proposed write. */
  readonly confirmWrite: (action: WriteAction) => Promise<boolean>;
  readonly onToken: (token: string) => void;
  readonly onToolStatus?: (status: string) => void;
  readonly signal?: AbortSignal;
};

export async function streamAskWithTools({
  messages,
  db,
  queryClient,
  scope,
  confirmWrite,
  onToken,
  onToolStatus,
  signal,
}: StreamAskWithToolsInput): Promise<string> {
  const provider = useAppStore.getState().aiProvider;
  getChatKey(provider);
  const providerMessages = toProviderMessages(messages);
  const { accounts, limited } = resolveScopeAccounts(await getAccounts(db), scope.accountIds);
  const systemPrompt = buildSystemPrompt(scope.period, limited);
  const accountIds = accounts.map((a) => a.id);
  const runTool = (call: ToolCall) => isWriteTool(call.name)
    ? executeWriteToolCall({ db, queryClient, accountIds, confirm: confirmWrite }, call.name, call.arguments)
    : executeToolCall(db, call.name, call.arguments, accountIds);
  const providerFunction = provider === 'openai' ? streamWithToolsOpenAI : streamWithToolsAnthropic;
  return providerFunction({ getApiKey: () => getChatKey(provider), systemPrompt, providerMessages, runTool, onToken, onToolStatus, signal });
}

type RunTool = (call: ToolCall) => Promise<string>;

// OpenAI streaming with tool loop
async function streamWithToolsOpenAI({
  getApiKey,
  systemPrompt,
  providerMessages,
  runTool,
  onToken,
  onToolStatus,
  signal,
}: {
  getApiKey: () => string;
  systemPrompt: string;
  providerMessages: readonly ProviderChatMessage[];
  runTool: RunTool;
  onToken: (token: string) => void;
  onToolStatus?: (status: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  let openAiMessages = buildOpenAiMessages(systemPrompt, providerMessages);

  for (let round = 0; round < AI_MAX_TOOL_ROUNDS; round++) {
    const result = await streamAskOpenAI(getApiKey(), openAiMessages, onToken, signal);
    if (result.type === 'text') return result.content;

    // Execute tool calls
    openAiMessages = appendOpenAiToolCall(openAiMessages, result.content, result.calls);
    openAiMessages = await executeOpenAiToolCalls(runTool, result.calls, openAiMessages, onToolStatus);
  }

  // Final round — stream response after tool results
  const finalResult = await streamAskOpenAI(getApiKey(), openAiMessages, onToken, signal);
  return finalResult.content;
}

// Anthropic streaming with tool loop
async function streamWithToolsAnthropic({
  getApiKey,
  systemPrompt,
  providerMessages,
  runTool,
  onToken,
  onToolStatus,
  signal,
}: {
  getApiKey: () => string;
  systemPrompt: string;
  providerMessages: readonly ProviderChatMessage[];
  runTool: RunTool;
  onToken: (token: string) => void;
  onToolStatus?: (status: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  let anthropicMessages = buildAnthropicMessages(providerMessages);

  for (let round = 0; round < AI_MAX_TOOL_ROUNDS; round++) {
    const result = await streamAskAnthropic({ apiKey: getApiKey(), systemPrompt, messages: anthropicMessages, onToken, signal });
    if (result.type === 'text') return result.content;

    // Execute tool calls
    anthropicMessages = appendAnthropicToolCall(anthropicMessages, result.content, result.calls);
    anthropicMessages = await executeAnthropicToolCalls(runTool, result.calls, anthropicMessages, onToolStatus);
  }

  // Final round
  const finalResult = await streamAskAnthropic({ apiKey: getApiKey(), systemPrompt, messages: anthropicMessages, onToken, signal });
  return finalResult.content;
}

// ─── Shared tool execution helpers ───

async function executeOpenAiToolCalls(
  runTool: RunTool,
  calls: readonly ToolCall[],
  messages: ReturnType<typeof buildOpenAiMessages>,
  onToolStatus?: (status: string) => void,
) {
  let result = messages;
  for (const call of calls) {
    onToolStatus?.(getToolStatusMessage(call.name, call.arguments));
    const toolResult = await runTool(call);
    result = appendOpenAiToolResult(result, call.id, toolResult);
  }
  return result;
}

async function executeAnthropicToolCalls(
  runTool: RunTool,
  calls: readonly ToolCall[],
  messages: ReturnType<typeof buildAnthropicMessages>,
  onToolStatus?: (status: string) => void,
) {
  let result = messages;
  for (const call of calls) {
    onToolStatus?.(getToolStatusMessage(call.name, call.arguments));
    const toolResult = await runTool(call);
    result = appendAnthropicToolResult(result, call.id, toolResult);
  }
  return result;
}
