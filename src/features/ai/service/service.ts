import type { SQLiteDatabase } from 'expo-sqlite';

import type { AiScope, ChatMessage, ProviderChatMessage, ToolCall } from '../types';

import { AI_MAX_TOOL_ROUNDS } from '@/config';
import { getAccounts } from '@/features/accounts/queries';
import { useAppStore } from '@/lib/store/store';
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
  readonly scope: AiScope;
  readonly onToken: (token: string) => void;
  readonly onToolStatus?: (status: string) => void;
  readonly signal?: AbortSignal;
};

export async function streamAskWithTools({
  messages,
  db,
  scope,
  onToken,
  onToolStatus,
  signal,
}: StreamAskWithToolsInput): Promise<string> {
  const { provider, apiKey } = getProviderData();
  const providerMessages = toProviderMessages(messages);
  const { accounts, limited } = resolveScopeAccounts(await getAccounts(db), scope.accountIds);
  const systemPrompt = buildSystemPrompt(scope.period, limited);
  const runTool = (call: ToolCall) => executeToolCall(db, call.name, call.arguments, accounts.map((a) => a.id));
  const providerFunction = provider === 'openai' ? streamWithToolsOpenAI : streamWithToolsAnthropic;
  return providerFunction({ apiKey, systemPrompt, providerMessages, runTool, onToken, onToolStatus, signal });
}

type RunTool = (call: ToolCall) => Promise<string>;

// OpenAI streaming with tool loop
async function streamWithToolsOpenAI({
  apiKey,
  systemPrompt,
  providerMessages,
  runTool,
  onToken,
  onToolStatus,
  signal,
}: {
  apiKey: string;
  systemPrompt: string;
  providerMessages: readonly ProviderChatMessage[];
  runTool: RunTool;
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
    openAiMessages = await executeOpenAiToolCalls(runTool, result.calls, openAiMessages, onToolStatus);
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
  runTool,
  onToken,
  onToolStatus,
  signal,
}: {
  apiKey: string;
  systemPrompt: string;
  providerMessages: readonly ProviderChatMessage[];
  runTool: RunTool;
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
    anthropicMessages = await executeAnthropicToolCalls(runTool, result.calls, anthropicMessages, onToolStatus);
  }

  // Final round
  const finalResult = await streamAskAnthropic({ apiKey, systemPrompt, messages: anthropicMessages, onToken, signal });
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
