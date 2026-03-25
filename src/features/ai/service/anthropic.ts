import type { ProviderChatMessage, StreamResponse, ToolCall } from '../types';
import { ANTHROPIC_MODEL } from '@/config';
import { streamSseEventsFromResponse } from './streaming';
import { TOOL_DEFINITIONS_ANTHROPIC } from './tools';

const MAX_PROVIDER_ERROR_LENGTH = 240;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MAX_TOKENS = 1024;

function trimErrorMessage(message: string) {
  const trimmed = message.trim();
  if (trimmed.length <= MAX_PROVIDER_ERROR_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_PROVIDER_ERROR_LENGTH)}...`;
}

async function buildAnthropicError(res: Response) {
  const fallbackMessage = 'Failed to get response from Anthropic';

  try {
    const errorText = await res.text();
    if (!errorText) return new Error(fallbackMessage);

    try {
      const errorJson = JSON.parse(errorText) as {
        error?: { message?: string };
      };
      const providerMessage = errorJson.error?.message?.trim();
      return new Error(providerMessage ? `Anthropic error: ${trimErrorMessage(providerMessage)}` : fallbackMessage);
    }
    catch {
      return new Error(fallbackMessage);
    }
  }
  catch {
    return new Error(fallbackMessage);
  }
}

// ─── Message Types ───

type AnthropicTextBlock = { type: 'text'; text: string };
type AnthropicToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
type AnthropicToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string };
export type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock | AnthropicToolResultBlock;

export type AnthropicRequestMessage = {
  role: 'user' | 'assistant';
  content: string | readonly AnthropicContentBlock[];
};

export type AnthropicSendInput = {
  apiKey: string;
  systemPrompt: string;
  messages: readonly AnthropicRequestMessage[];
};

export function buildAnthropicMessages(
  providerMessages: readonly ProviderChatMessage[],
): AnthropicRequestMessage[] {
  return providerMessages.map((m) => ({
    role: m.role === 'user' ? 'user' as const : 'assistant' as const,
    content: [{ type: 'text' as const, text: m.content }],
  }));
}

export function appendAnthropicToolCall(
  messages: readonly AnthropicRequestMessage[],
  assistantContent: string,
  toolCalls: readonly ToolCall[],
): AnthropicRequestMessage[] {
  const blocks: AnthropicContentBlock[] = [];
  if (assistantContent) {
    blocks.push({ type: 'text', text: assistantContent });
  }
  for (const tc of toolCalls) {
    blocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.arguments });
  }

  return [
    ...messages,
    { role: 'assistant', content: blocks },
  ];
}

export function appendAnthropicToolResult(
  messages: readonly AnthropicRequestMessage[],
  toolCallId: string,
  result: string,
): AnthropicRequestMessage[] {
  const lastMessage = messages.at(-1);
  const resultBlock: AnthropicToolResultBlock = { type: 'tool_result', tool_use_id: toolCallId, content: result };

  // Anthropic requires tool results in a user message. If the last message is already
  // a user message with tool_result blocks, append to it; otherwise create a new user message.
  if (lastMessage?.role === 'user' && Array.isArray(lastMessage.content)) {
    return [
      ...messages.slice(0, -1),
      { role: 'user', content: [...lastMessage.content, resultBlock] },
    ];
  }

  return [
    ...messages,
    { role: 'user', content: [resultBlock] },
  ];
}

const ANTHROPIC_HEADERS = {
  'Content-Type': 'application/json',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
} as const;

function buildHeaders(apiKey: string) {
  return { ...ANTHROPIC_HEADERS, 'x-api-key': apiKey };
}

export async function askAnthropic(
  apiKey: string,
  systemPrompt: string,
  messages: readonly AnthropicRequestMessage[],
): Promise<StreamResponse> {
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: systemPrompt,
    messages,
    tools: TOOL_DEFINITIONS_ANTHROPIC,
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await buildAnthropicError(res);
  }

  const json = await res.json();
  const content = json.content as AnthropicContentBlock[] | undefined;
  const stopReason = json.stop_reason as string | undefined;

  if (stopReason === 'tool_use' && content) {
    const textContent = content
      .filter((b): b is AnthropicTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const calls: ToolCall[] = content
      .filter((b): b is AnthropicToolUseBlock => b.type === 'tool_use')
      .map((b) => ({ id: b.id, name: b.name, arguments: b.input }));

    return { type: 'tool_calls', content: textContent, calls };
  }

  const textContent = content
    ?.filter((b): b is AnthropicTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('') ?? '';

  return { type: 'text', content: textContent };
}

type StreamAnthropicInput = {
  apiKey: string;
  systemPrompt: string;
  messages: readonly AnthropicRequestMessage[];
  onToken: (token: string) => void;
  signal?: AbortSignal;
};

export async function streamAskAnthropic({
  apiKey,
  systemPrompt,
  messages,
  onToken,
  signal,
}: StreamAnthropicInput): Promise<StreamResponse> {
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: systemPrompt,
    messages,
    tools: TOOL_DEFINITIONS_ANTHROPIC,
    stream: true,
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: { ...buildHeaders(apiKey), Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw await buildAnthropicError(res);
  }

  let fullContent = '';
  // Accumulate tool use blocks
  const toolBlocks: Array<{ id: string; name: string; inputJson: string }> = [];
  let currentToolBlock: { id: string; name: string; inputJson: string } | null = null;

  await streamSseEventsFromResponse(res, {
    signal,
    onEvent: async (event) => {
      const data = event.data.trim();
      if (!data) return;

      let json: unknown;
      try {
        json = JSON.parse(data);
      }
      catch {
        return;
      }

      const eventType = event.event ?? (json as any)?.type;

      // Text content streaming
      if (eventType === 'content_block_delta') {
        const deltaType = (json as any)?.delta?.type;

        if (deltaType === 'text_delta') {
          const token = (json as any)?.delta?.text;
          if (typeof token === 'string' && token) {
            fullContent += token;
            onToken(token);
          }
          return;
        }

        // Tool input JSON delta
        if (deltaType === 'input_json_delta') {
          const partial = (json as any)?.delta?.partial_json;
          if (typeof partial === 'string' && currentToolBlock) {
            currentToolBlock.inputJson += partial;
          }
          return;
        }

        return;
      }

      // Start of a new content block
      if (eventType === 'content_block_start') {
        const blockType = (json as any)?.content_block?.type;
        if (blockType === 'tool_use') {
          currentToolBlock = {
            id: (json as any)?.content_block?.id ?? '',
            name: (json as any)?.content_block?.name ?? '',
            inputJson: '',
          };
        }
        return;
      }

      // End of a content block
      if (eventType === 'content_block_stop') {
        if (currentToolBlock) {
          toolBlocks.push(currentToolBlock);
          currentToolBlock = null;
        }
        return;
      }

      if (eventType === 'message_stop') return true;
    },
  });

  if (toolBlocks.length > 0) {
    const calls: ToolCall[] = toolBlocks.map((tb) => ({
      id: tb.id,
      name: tb.name,
      arguments: (tb.inputJson ? JSON.parse(tb.inputJson) : {}) as Record<string, unknown>,
    }));
    return { type: 'tool_calls', content: fullContent, calls };
  }

  return { type: 'text', content: fullContent };
}
