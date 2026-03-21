import type { ChatMessage } from '@/features/ai/service';
import { Link } from 'expo-router';
import * as React from 'react';

import { KeyboardAvoidingView, Platform } from 'react-native';
import { FocusAwareStatusBar, Input, SafeAreaView, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { SendHorizonal } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { askAnthropic, askOpenAI } from '@/features/ai/service';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';

const PRESET_QUESTIONS = [
  translate('ai.preset_overview'),
  translate('ai.preset_groceries'),
  translate('ai.preset_overspending'),
  translate('ai.preset_monthly_budget'),
  translate('ai.preset_subscriptions'),
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
  const hasKey = hasOpenAI || hasAnthropic;

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
      setError(e?.message ?? translate('ai.contact_error'));
    }
    finally {
      setLoading(false);
    }
  }, [provider, anthropicApiKey, messages, openaiApiKey, question, loading]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FocusAwareStatusBar />
        <View className="flex-1">
          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerClassName="pb-8"
            style={defaultStyles.transparentBg}
          >
            {(!hasKey)
              ? (
                  <View className="mb-4 rounded-xl bg-card p-4">
                    <Text className="text-muted-foreground">
                      {translate('ai.add_api_key_in')}
                      {' '}
                      <Link href="/settings/ai" className="mx-1 font-medium text-foreground underline">
                        {translate('ai.ai_setting')}
                      </Link>
                      {' '}
                      {translate('ai.to_start_chatting')}
                    </Text>
                  </View>
                )
              : !messages.length
                  ? (
                      <View className="my-4">
                        <Text className="mb-2 text-muted-foreground">
                          {translate('ai.ask_prompt')}
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

          <View className="bg-background px-4 pb-safe-offset-2">
            <View className="relative">
              <Input
                variant="textarea"
                value={question}
                onChangeText={setQuestion}
                placeholder={translate('ai.input_placeholder')}
                autoCapitalize="sentences"
                autoCorrect
                multiline
                disabled={!hasKey}
                className="min-h-[80] py-2 pr-12"
              />
              <IconButton
                size="sm"
                onPress={() => {
                  void handleSend();
                }}
                disabled={loading || !question.trim() || !hasKey}
                className="absolute right-2 bottom-2 rounded-full"
              >
                <SendHorizonal className="size-5 text-background disabled:text-foreground" />
              </IconButton>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
