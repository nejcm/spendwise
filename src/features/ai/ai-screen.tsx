import type { ChatMessage } from '@/features/ai/service';
import { Link } from 'expo-router';
import { SendHorizonal } from 'lucide-react-native';

import * as React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { FocusAwareStatusBar, Input, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { askAnthropic, askOpenAI } from '@/features/ai/service';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { IconButton } from '../../components/ui/icon-button';

const PRESET_QUESTIONS = [
  'Give me an overview of my spending this month.',
  'How much did I spend on groceries last month?',
  'Where am I overspending compared to my budget?',
  'Help me create a monthly budget based on my recent transactions.',
  'What subscriptions could I cancel to save money?',
];

export function AiScreen() {
  const provider = useAppStore.use.aiProvider();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [question, setQuestion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasOpenAI = Boolean(openaiApiKey);
  const hasAnthropic = Boolean(anthropicApiKey);

  const handleSend = React.useCallback(async (presetQuestion?: string) => {
    const sourceQuestion = presetQuestion ?? question;
    const trimmed = sourceQuestion.trim();
    if (!trimmed || loading) return;
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
  }, [provider, anthropicApiKey, messages, openaiApiKey, question, loading]);

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
          {(!hasOpenAI && !hasAnthropic)
            ? (
                <View className="mb-4 rounded-xl bg-card p-4">
                  <Text className="text-muted-foreground">
                    Add an API key in
                    <Link href="/settings/ai" className="mx-1 font-medium text-foreground underline">
                      AI Setting
                    </Link>
                    to start chatting with the assistant.
                  </Text>
                </View>
              )
            : !messages.length
                ? (
                    <View className="my-4">
                      <Text className="mb-2 text-muted-foreground">
                        Ask the AI about your spending or budgeting...
                      </Text>
                      <View className="mt-3 flex flex-col space-y-2">
                        {PRESET_QUESTIONS.map((q) => (
                          <SolidButton
                            key={q}
                            color="secondary"
                            size="sm"
                            label={q}
                            className="h-auto rounded-3xl px-4 py-2"
                            textClassName="text-left text-muted-foreground leading-tight"
                            onPress={() => {
                              void handleSend(q);
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  )
                : null}

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
                  ? 'self-end bg-black'
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

        <View className="border-t border-border bg-background px-4 pt-2 pb-safe-offset-2">
          <View className="relative">
            <Input
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask the AI about your spending or budgets..."
              autoCapitalize="sentences"
              autoCorrect
              multiline
              className="pr-12"
            />
            <IconButton
              size="sm"
              onPress={() => {
                void handleSend();
              }}
              disabled={loading || !question.trim()}
              className="absolute right-2 bottom-3 rounded-full"
            >
              <SendHorizonal className="size-5 text-background disabled:text-foreground" />
            </IconButton>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
