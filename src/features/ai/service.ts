export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export async function askOpenAI(apiKey: string, messages: ChatMessage[], question: string) {
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that helps users understand their personal finances and budgeting. Answer clearly and concisely.',
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ],
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
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

export async function askAnthropic(apiKey: string, messages: ChatMessage[], question: string) {
  const anthropicMessages = [
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: [{ type: 'text', text: m.content }],
    })),
    {
      role: 'user',
      content: [{ type: 'text', text: question }],
    },
  ];

  const body = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 512,
    system:
      'You are a helpful assistant that helps users understand their personal finances and budgeting. Answer clearly and concisely.',
    messages: anthropicMessages,
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('Failed to get response from Anthropic');
  }

  const json = await res.json();
  const content = json.content?.[0]?.text ?? '';
  return typeof content === 'string' ? content : String(content);
}
