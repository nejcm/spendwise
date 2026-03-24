import type { ProviderChatMessage } from '../types';
import { OPEN_AI_MODEL } from '@/config';
import { BASE_PROMPT } from './constants';
import { streamSseEventsFromResponse } from './streaming';

const OPEN_AI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function askOpenAI(apiKey: string | undefined, messages: ProviderChatMessage[]) {
  if (!apiKey) {
    throw new Error('OpenAI API key is not set');
  }

  const body = {
    model: OPEN_AI_MODEL,
    messages: [
      {
        role: 'system',
        content: BASE_PROMPT,
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
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
    throw new Error('Failed to get response from OpenAI');
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  return typeof content === 'string' ? content : String(content);
}

export async function streamAskOpenAI(
  apiKey: string | undefined,
  messages: ProviderChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
) {
  if (!apiKey) {
    throw new Error('OpenAI API key is not set');
  }

  const body = {
    model: OPEN_AI_MODEL,
    messages: [
      {
        role: 'system',
        content: BASE_PROMPT,
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
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
        // Ignore unparseable events.
        return;
      }

      const token = (json as any)?.choices?.[0]?.delta?.content;
      if (typeof token === 'string' && token) {
        fullContent += token;
        onToken(token);
      }
    },
  });

  return fullContent;
}
