import { fetch as expoFetch } from 'expo/fetch';
import * as React from 'react';
import { useAppStore } from '../store';
import { ANTHROPIC_MODEL, OPENAI_MODEL } from './constants';

type MessagePart = { type: 'text'; text: string };

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
};

type UseChatOptions = {
  onError?: (error: Error) => void;
};

let nextId = 0;
function generateId() {
  return `msg-${Date.now()}-${++nextId}`;
}

// ---------------------------------------------------------------------------
// SSE line parser – shared by both providers
// ---------------------------------------------------------------------------

async function* readSSELines(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        yield trimmed.slice(6);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Provider-specific streaming
// ---------------------------------------------------------------------------

function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content: m.parts.map((p) => p.text).join(''),
  }));
}

async function* streamOpenAI(apiKey: string, messages: ChatMessage[]) {
  const response = await (expoFetch as typeof globalThis.fetch)(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: toOpenAIMessages(messages),
        stream: true,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenAI error ${response.status}: ${body}`);
  }

  for await (const data of readSSELines(response)) {
    if (data === '[DONE]') return;
    try {
      const parsed = JSON.parse(data);
      const content: string | undefined = parsed.choices?.[0]?.delta?.content;
      if (content) yield content;
    }
    catch { /* skip non-JSON lines */ }
  }
}

function toAnthropicMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content: m.parts.map((p) => p.text).join(''),
  }));
}

async function* streamAnthropic(apiKey: string, messages: ChatMessage[]) {
  const response = await (expoFetch as typeof globalThis.fetch)(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        messages: toAnthropicMessages(messages),
        max_tokens: 4096,
        stream: true,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Anthropic error ${response.status}: ${body}`);
  }

  for await (const data of readSSELines(response)) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'content_block_delta') {
        const text: string | undefined = parsed.delta?.text;
        if (text) yield text;
      }
    }
    catch { /* skip non-JSON lines */ }
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat({ onError }: UseChatOptions) {
  const provider = useAppStore.use.aiProvider();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();
  const apiKey = provider === 'anthropic' ? anthropicApiKey : openaiApiKey;
  const isEnabled = provider !== 'none' && Boolean(apiKey);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Keep a ref so the streaming callback always sees the latest messages
  const messagesRef = React.useRef(messages);
  messagesRef.current = messages;

  const sendMessage = React.useCallback(
    async ({ text }: { text: string }) => {
      if (!text.trim() || isLoading || !isEnabled) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        parts: [{ type: 'text', text }],
      };

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      };

      const updatedMessages = [...messagesRef.current, userMessage];
      setMessages([...updatedMessages, assistantMessage]);
      setError(null);
      setIsLoading(true);

      try {
        if (!apiKey) throw new Error('API key is not set');
        const stream
          = provider === 'anthropic'
            ? streamAnthropic(apiKey, updatedMessages)
            : streamOpenAI(apiKey, updatedMessages);

        for await (const chunk of stream) {
          setMessages((prev) => {
            const last = prev.at(-1);
            if (last?.role !== 'assistant') return prev;
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                parts: [{ type: 'text' as const, text: last.parts[0].text + chunk }],
              },
            ];
          });
        }
      }
      catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError?.(e);
      }
      finally {
        setIsLoading(false);
      }
    },
    [isLoading, isEnabled, apiKey, provider, onError],
  );

  return { messages, error, isLoading, sendMessage } as const;
}
