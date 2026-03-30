import type { ProviderChatMessage, StreamResponse, ToolCall } from '../types';
import { OPEN_AI_API_URL, OPEN_AI_MODEL } from '@/config';
import { streamSseEventsFromResponse } from './streaming';
import { TOOL_DEFINITIONS_OPENAI } from './tools';

export type OpenAiRequestMessage
  = { role: 'system' | 'user' | 'assistant'; content: string }
    | { role: 'assistant'; content: string | null; tool_calls: readonly OpenAiToolCallPayload[] }
    | { role: 'tool'; tool_call_id: string; content: string };

export type OpenAiToolCallPayload = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type OpenAiSendInput = {
  apiKey: string;
  systemPrompt: string;
  messages: readonly OpenAiRequestMessage[];
};

export function buildOpenAiMessages(
  systemPrompt: string,
  providerMessages: readonly ProviderChatMessage[],
): OpenAiRequestMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...providerMessages.map((m) => ({ role: m.role, content: m.content }) as OpenAiRequestMessage),
  ];
}

export function appendOpenAiToolCall(
  messages: readonly OpenAiRequestMessage[],
  assistantContent: string,
  toolCalls: readonly ToolCall[],
): OpenAiRequestMessage[] {
  const toolCallPayloads: OpenAiToolCallPayload[] = toolCalls.map((tc) => ({
    id: tc.id,
    type: 'function',
    function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
  }));

  return [
    ...messages,
    { role: 'assistant', content: assistantContent || null, tool_calls: toolCallPayloads },
  ];
}

export function appendOpenAiToolResult(
  messages: readonly OpenAiRequestMessage[],
  toolCallId: string,
  result: string,
): OpenAiRequestMessage[] {
  return [
    ...messages,
    { role: 'tool', tool_call_id: toolCallId, content: result },
  ];
}

export async function askOpenAI(apiKey: string, messages: readonly OpenAiRequestMessage[]) {
  const body = {
    model: OPEN_AI_MODEL,
    messages,
    tools: TOOL_DEFINITIONS_OPENAI,
  };

  const res = await fetch(OPEN_AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('Failed to get response from OpenAI');
  }

  const json = await res.json();
  const message = json.choices?.[0]?.message;
  const finishReason = json.choices?.[0]?.finish_reason;

  if (finishReason === 'tool_calls' && message?.tool_calls) {
    const calls: ToolCall[] = (message.tool_calls as OpenAiToolCallPayload[]).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }));

    return {
      type: 'tool_calls' as const,
      content: message.content ?? '',
      calls,
    };
  }

  const content = message?.content ?? '';
  return { type: 'text' as const, content: typeof content === 'string' ? content : String(content) };
}

export async function streamAskOpenAI(
  apiKey: string,
  messages: readonly OpenAiRequestMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<StreamResponse> {
  const body = {
    model: OPEN_AI_MODEL,
    messages,
    tools: TOOL_DEFINITIONS_OPENAI,
    stream: true,
  };

  const res = await fetch(OPEN_AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new Error('Failed to get response from OpenAI');
  }

  let fullContent = '';
  // Accumulate tool calls across streamed deltas.
  const toolCallAccumulator: Record<number, { id: string; name: string; args: string }> = {};
  let hasToolCalls = false;

  await streamSseEventsFromResponse(res, {
    signal,
    onEvent: async (event) => {
      const data = event.data.trim();
      if (!data) return;
      if (data === '[DONE]') return true;

      let json: unknown;
      try {
        json = JSON.parse(data);
      }
      catch {
        return;
      }

      const delta = (json as any)?.choices?.[0]?.delta;
      if (!delta) return;

      // Text content
      const token = delta.content;
      if (typeof token === 'string' && token) {
        fullContent += token;
        onToken(token);
      }

      // Tool calls — OpenAI streams these as incremental deltas
      const toolCallDeltas = delta.tool_calls as Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }> | undefined;

      if (toolCallDeltas) {
        hasToolCalls = true;
        for (const tc of toolCallDeltas) {
          const existing = toolCallAccumulator[tc.index];
          if (!existing) {
            toolCallAccumulator[tc.index] = {
              id: tc.id ?? '',
              name: tc.function?.name ?? '',
              args: tc.function?.arguments ?? '',
            };
          }
          else {
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name += tc.function.name;
            if (tc.function?.arguments) existing.args += tc.function.arguments;
          }
        }
      }
    },
  });

  if (hasToolCalls) {
    const calls: ToolCall[] = Object.values(toolCallAccumulator).map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: JSON.parse(tc.args) as Record<string, unknown>,
    }));
    return { type: 'tool_calls', content: fullContent, calls };
  }

  return { type: 'text', content: fullContent };
}

// ─── Receipt Scanning ───

export async function scanReceiptOpenAI(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png',
  prompt: string,
  apiKey: string,
): Promise<string> {
  const body = {
    model: OPEN_AI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'auto' },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  };

  const res = await fetch(OPEN_AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`OpenAI error: ${errorText || res.status}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return content as string;
}
