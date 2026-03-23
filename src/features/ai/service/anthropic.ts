import type { ProviderChatMessage } from './types';
import { ANTHROPIC_MODEL } from '@/config';
import { BASE_PROMPT } from './constants';
import { streamSseEventsFromResponse } from './streaming';

const MAX_PROVIDER_ERROR_LENGTH = 240;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

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

export async function askAnthropic(apiKey: string | undefined, messages: ProviderChatMessage[]) {
  if (!apiKey) {
    throw new Error('Anthropic API key is not set');
  }

  const anthropicMessages = [
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: [{ type: 'text', text: m.content }],
    })),
  ];

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 512,
    system: BASE_PROMPT,
    messages: anthropicMessages,
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await buildAnthropicError(res);
  }

  const json = await res.json();
  const content = json.content?.[0]?.text ?? '';
  return typeof content === 'string' ? content : String(content);
}

export async function streamAskAnthropic(
  apiKey: string | undefined,
  messages: ProviderChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
) {
  if (!apiKey) {
    throw new Error('Anthropic API key is not set');
  }

  const anthropicMessages = [
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: [{ type: 'text', text: m.content }],
    })),
  ];

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 512,
    system: BASE_PROMPT,
    messages: anthropicMessages,
    stream: true,
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw await buildAnthropicError(res);
  }

  let fullContent = '';

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
        // Ignore unparseable events.
        return;
      }

      const eventType = event.event ?? (json as any)?.type;

      if (eventType === 'content_block_delta') {
        const deltaType = (json as any)?.delta?.type;
        if (deltaType !== 'text_delta') return;

        const token = (json as any)?.delta?.text;
        if (typeof token === 'string' && token) {
          fullContent += token;
          onToken(token);
        }

        return;
      }

      if (eventType === 'message_stop') return true;
    },
  });

  return fullContent;
}
