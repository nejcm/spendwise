import { Link } from 'expo-router';

import * as React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { FocusAwareStatusBar, Input, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { Plus, SendHorizonal } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { AssistantMessage } from '@/features/ai/components/assistant-message';
import { setAiDraftQuestion } from '@/features/ai/store';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { useChat } from './use-chat';

const PRESET_QUESTIONS = [
  translate('ai.preset_overview'),
  translate('ai.preset_groceries'),
  translate('ai.preset_overspending'),
  translate('ai.preset_monthly_budget'),
  translate('ai.preset_subscriptions'),
];

export function AiScreen() {
  const {
    hasKey,
    messages,
    question,
    isStreaming,
    streamingAssistantId,
    streamedAssistantContent,
    errorMessage,
    handleNewChat,
    handleSend,
    markdownStyle,
  } = useChat();
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
                disabled={isStreaming || !messages.length}
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

            {messages.map((m) => (
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
                        content={m.id === streamingAssistantId ? streamedAssistantContent : m.content}
                        streaming={isStreaming && m.id === streamingAssistantId}
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
                onChangeText={setAiDraftQuestion}
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
                disabled={isStreaming || !question.trim() || !hasKey}
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
