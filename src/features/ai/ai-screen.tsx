import * as React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { Button, FocusAwareStatusBar, Input, ScrollView, Text, View } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

async function askOpenAI(apiKey: string, messages: ChatMessage[], question: string) {
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that helps users understand their personal finances and budgeting. Answer clearly and concisely.',
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ],
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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

async function askAnthropic(apiKey: string, messages: ChatMessage[], question: string) {
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
    system: 'You are a helpful assistant that helps users understand their personal finances and budgeting. Answer clearly and concisely.',
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

export function AiScreen() {
  const aiProvider = useAppStore.use.aiProvider();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();

  const [provider, setProvider] = React.useState(aiProvider);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [question, setQuestion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasOpenAI = Boolean(openaiApiKey);
  const hasAnthropic = Boolean(anthropicApiKey);

  const handleSend = React.useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    if (provider === 'openai' && !openaiApiKey) {
      setError('Please add your OpenAI API key in Settings > AI.');
      return;
    }
    if (provider === 'anthropic' && !anthropicApiKey) {
      setError('Please add your Anthropic API key in Settings > AI.');
      return;
    }

    setError(null);

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setQuestion('');
    setLoading(true);

    try {
      const answer = provider === 'openai'
        ? await askOpenAI(openaiApiKey as string, currentMessages, trimmed)
        : await askAnthropic(anthropicApiKey as string, currentMessages, trimmed);

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: answer,
      };
      setMessages([...currentMessages, assistantMessage]);
    }
    catch (e: any) {
      setError(e?.message ?? 'Something went wrong while contacting the AI provider.');
    }
    finally {
      setLoading(false);
    }
  }, [anthropicApiKey, messages, openaiApiKey, provider, question, loading]);

  React.useEffect(() => {
    setProvider(aiProvider);
  }, [aiProvider]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FocusAwareStatusBar />
      <View className="flex-1">
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerClassName="pb-4"
          style={defaultStyles.transparentBg}
        >
          <View className="mb-4 flex-row rounded-full bg-muted p-1">
            <Button
              variant={provider === 'openai' ? 'default' : 'unstyled'}
              className={`flex-1 rounded-full ${provider === 'openai' ? '' : 'bg-transparent'}`}
              label="OpenAI"
              disabled={!hasOpenAI}
              onPress={() => setProvider('openai')}
            />
            <Button
              variant={provider === 'anthropic' ? 'default' : 'unstyled'}
              className={`ml-2 flex-1 rounded-full ${provider === 'anthropic' ? '' : 'bg-transparent'}`}
              label="Anthropic"
              disabled={!hasAnthropic}
              onPress={() => setProvider('anthropic')}
            />
          </View>

          {(!hasOpenAI && !hasAnthropic) && (
            <View className="mb-4 rounded-xl bg-card p-4">
              <Text className="text-sm text-muted-foreground">
                Add an API key in
                {' '}
                <Text className="font-semibold">Settings &gt; AI</Text>
                {' '}
                to start chatting with the assistant.
              </Text>
            </View>
          )}

          {error && (
            <View className="mb-4 rounded-md bg-danger-500/10 p-3">
              <Text className="text-sm text-danger-500">{error}</Text>
            </View>
          )}

          {messages.map((m) => (
            <View
              key={m.id}
              className={`mb-2 max-w-[85%] rounded-2xl px-3 py-2 ${
                m.role === 'user'
                  ? 'self-end bg-primary'
                  : 'self-start bg-card'
              }`}
            >
              <Text
                className={m.role === 'user' ? 'text-sm text-white' : 'text-sm text-foreground'}
              >
                {m.content}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View className="border-t border-border bg-background px-4 pb-safe-offset-2 pt-2">
          <Input
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask the AI about your spending or budgets..."
            autoCapitalize="sentences"
            autoCorrect
            multiline
          />
          <View className="mt-2 flex-row items-center justify-end">
            <Button
              label="Send"
              onPress={handleSend}
              loading={loading}
              disabled={!question.trim()}
              variant="default"
              className="min-w-[96px]"
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

