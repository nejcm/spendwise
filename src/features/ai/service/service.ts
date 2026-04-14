import type { SQLiteDatabase } from 'expo-sqlite';

import type { ChatMessage, ProviderChatMessage, ToolCall } from '../types';

import { AI_MAX_TOOL_ROUNDS } from '@/config';
import { useAppStore } from '@/lib/store/store';
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
import { executeToolCall, getToolStatusMessage } from './tool-executor';

function toProviderMessages(messages: readonly ChatMessage[]): ProviderChatMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

function getProviderData() {
  const { aiProvider, openaiApiKey, anthropicApiKey } = useAppStore.getState();
  let key: string | undefined;
  switch (aiProvider) {
    case 'openai':
      key = openaiApiKey;
      break;
    case 'anthropic':
      key = anthropicApiKey;
      break;
    default:
      throw new Error(`Invalid provider: ${aiProvider}`);
  }
  if (!key) throw new Error(`API key is not set for ${aiProvider}`);
  return { provider: aiProvider, apiKey: key };
}

// ─── Streaming with tool-call loop ───

type StreamAskWithToolsInput = {
  readonly messages: readonly ChatMessage[];
  readonly db: SQLiteDatabase;
  readonly onToken: (token: string) => void;
  readonly onToolStatus?: (status: string) => void;
  readonly signal?: AbortSignal;
};

export async function streamAskWithTools({
  messages,
  db,
  onToken,
  onToolStatus,
  signal,
}: StreamAskWithToolsInput): Promise<string> {
  const { provider, apiKey } = getProviderData();
  const providerMessages = toProviderMessages(messages);
  const systemPrompt = buildSystemPrompt();
  const providerFunction = provider === 'openai' ? streamWithToolsOpenAI : streamWithToolsAnthropic;
  return providerFunction({ apiKey, systemPrompt, providerMessages, db, onToken, onToolStatus, signal });
}

// OpenAI streaming with tool loop
async function streamWithToolsOpenAI({
  apiKey,
  systemPrompt,
  providerMessages,
  db,
  onToken,
  onToolStatus,
  signal,
}: {
  apiKey: string;
  systemPrompt: string;
  providerMessages: readonly ProviderChatMessage[];
  db: SQLiteDatabase;
  onToken: (token: string) => void;
  onToolStatus?: (status: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  let openAiMessages = buildOpenAiMessages(systemPrompt, providerMessages);

  for (let round = 0; round < AI_MAX_TOOL_ROUNDS; round++) {
    const result = await streamAskOpenAI(apiKey, openAiMessages, onToken, signal);
    if (result.type === 'text') return result.content;

    // Execute tool calls
    openAiMessages = appendOpenAiToolCall(openAiMessages, result.content, result.calls);
    openAiMessages = await executeOpenAiToolCalls(db, result.calls, openAiMessages, onToolStatus);
  }

  // Final round — stream response after tool results
  const finalResult = await streamAskOpenAI(apiKey, openAiMessages, onToken, signal);
  return finalResult.content;
}

// Anthropic streaming with tool loop
async function streamWithToolsAnthropic({
  apiKey,
  systemPrompt,
  providerMessages,
  db,
  onToken,
  onToolStatus,
  signal,
}: {
  apiKey: string;
  systemPrompt: string;
  providerMessages: readonly ProviderChatMessage[];
  db: SQLiteDatabase;
  onToken: (token: string) => void;
  onToolStatus?: (status: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  let anthropicMessages = buildAnthropicMessages(providerMessages);

  for (let round = 0; round < AI_MAX_TOOL_ROUNDS; round++) {
    const result = await streamAskAnthropic({ apiKey, systemPrompt, messages: anthropicMessages, onToken, signal });
    if (result.type === 'text') return result.content;

    // Execute tool calls
    anthropicMessages = appendAnthropicToolCall(anthropicMessages, result.content, result.calls);
    anthropicMessages = await executeAnthropicToolCalls(db, result.calls, anthropicMessages, onToolStatus);
  }

  // Final round
  const finalResult = await streamAskAnthropic({ apiKey, systemPrompt, messages: anthropicMessages, onToken, signal });
  return finalResult.content;
}

// ─── Shared tool execution helpers ───

async function executeOpenAiToolCalls(
  db: SQLiteDatabase,
  calls: readonly ToolCall[],
  messages: ReturnType<typeof buildOpenAiMessages>,
  onToolStatus?: (status: string) => void,
) {
  let result = messages;
  for (const call of calls) {
    onToolStatus?.(getToolStatusMessage(call.name, call.arguments));
    const toolResult = await executeToolCall(db, call.name, call.arguments);
    result = appendOpenAiToolResult(result, call.id, toolResult);
  }
  return result;
}

async function executeAnthropicToolCalls(
  db: SQLiteDatabase,
  calls: readonly ToolCall[],
  messages: ReturnType<typeof buildAnthropicMessages>,
  onToolStatus?: (status: string) => void,
) {
  let result = messages;
  for (const call of calls) {
    onToolStatus?.(getToolStatusMessage(call.name, call.arguments));
    const toolResult = await executeToolCall(db, call.name, call.arguments);
    result = appendAnthropicToolResult(result, call.id, toolResult);
  }
  return result;
}
