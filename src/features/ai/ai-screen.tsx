import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { ChatMessage } from '@/features/ai/service';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import * as React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { FocusAwareStatusBar, Input, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { Plus, SendHorizonal } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { AssistantMessage } from '@/features/ai/components/assistant-message';
import { buildAiPromptContext } from '@/features/ai/context';
import { ask } from '@/features/ai/service';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { getMarkdownStyle } from './helpers';

type AskVariables = {
  messages: ChatMessage[];
};

const PRESET_QUESTIONS = [
  translate('ai.preset_overview'),
  translate('ai.preset_groceries'),
  translate('ai.preset_overspending'),
  translate('ai.preset_monthly_budget'),
  translate('ai.preset_subscriptions'),
];

export function AiScreen() {
  const db = useSQLiteContext();
  const theme = useThemeConfig();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [question, setQuestion] = React.useState('');
  const hasKey = Boolean(openaiApiKey) || Boolean(anthropicApiKey);

  const askMutation = useMutation({
    mutationFn: async (vars: AskVariables) => {
      const latestMessage = vars.messages.at(-1);
      const context = latestMessage?.role === 'user'
        ? await buildAiPromptContext(db, latestMessage.content)
        : undefined;

      return ask({ messages: vars.messages, context });
    },
    onSuccess: (answer, vars) => {
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: answer,
      };
      setMessages([...vars.messages, assistantMessage]);
    },
  });
  const { isPending, mutate, reset: resetAskMutation } = askMutation;

  const handleNewChat = React.useCallback(() => {
    if (isPending) return;
    setMessages([]);
    setQuestion('');
    resetAskMutation();
  }, [isPending, resetAskMutation]);

  const handleSend = React.useCallback((presetQuestion?: string) => {
    const sourceQuestion = presetQuestion ?? question;
    const trimmed = sourceQuestion.trim();
    if (!trimmed || isPending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setQuestion('');
    mutate({ messages: currentMessages });
  }, [isPending, messages, mutate, question]);

  const errorMessage = askMutation.isError
    ? (askMutation.error instanceof Error
        ? askMutation.error.message
        : translate('ai.contact_error'))
    : null;

  const markdownStyle = React.useMemo<MarkdownStyle>(
    () => getMarkdownStyle(theme.dark),
    [theme.dark],
  );

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FocusAwareStatusBar />
        <View className="flex-1">
          {hasKey && messages.length > 0 && (
            <View className="flex-row items-center justify-end border-b border-border px-4 py-2">
              <SolidButton
                size="xs"
                label={translate('ai.new_chat')}
                iconLeft={<Plus className="text-background" size={15} />}
                onPress={handleNewChat}
                disabled={isPending || !messages.length}
              />
            </View>
          )}
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
                      <View className="py-6">
                        <Text className="mb-2 text-center">
                          {translate('ai.ask_prompt')}
                        </Text>
                        <View className="mt-3 flex flex-col gap-y-2">
                          {PRESET_QUESTIONS.map((q) => (
                            <SolidButton
                              key={q}
                              color="secondary"
                              size="sm"
                              label={q}
                              className="h-auto rounded-3xl px-4 py-2"
                              textClassName="text-left leading-tight text-foreground"
                              onPress={() => {
                                void handleSend(q);
                              }}
                            />
                          ))}
                        </View>
                      </View>
                    )
                  : null}

            {messages.map((m, index) => (
              <View
                key={m.id}
                className={`mb-2 max-w-[85%] rounded-lg px-3 py-2 ${
                  m.role === 'user'
                    ? 'self-end bg-black'
                    : 'self-start bg-card'
                }`}
              >
                {m.role === 'user'
                  ? (
                      <Text className="text-sm text-white">
                        {m.content}
                      </Text>
                    )
                  : (
                      <AssistantMessage
                        content={m.content}
                        streaming={isPending && index === messages.length - 1}
                        markdownStyle={markdownStyle}
                      />
                    )}
              </View>
            ))}

            {errorMessage && (
              <View className="my-4 rounded-lg bg-danger-500/10 px-3 py-2">
                <Text className="text-sm text-danger-500">{errorMessage}</Text>
              </View>
            )}
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
                numberOfLines={2}
                disabled={!hasKey}
                className="min-h-[80] pr-12"
              />
              <IconButton
                size="sm"
                onPress={() => {
                  void handleSend();
                }}
                disabled={isPending || !question.trim() || !hasKey}
                className="absolute right-2 bottom-2 rounded-full"
              >
                <SendHorizonal className="text-background disabled:text-foreground" size={20} />
              </IconButton>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
