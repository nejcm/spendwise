import { Link } from 'expo-router';
import * as React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { FocusAwareStatusBar, Input, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { Brain, Plus, SendHorizonal } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import AssistantMessage from '@/features/ai/components/assistant-message';
import AssistantMessageWeb from '@/features/ai/components/assistant-message.web';
import { IS_WEB } from '@/lib/base';
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

// markdown library not supported on web
const MessageComponent = IS_WEB ? AssistantMessageWeb : AssistantMessage;

type EmptyProps = {
  hasKey: boolean;
  hasMessages: boolean;
  onSend: (question: string) => void;
};
function Empty({ hasKey, hasMessages, onSend }: EmptyProps) {
  if (!hasKey) {
    return (
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
    );
  }
  if (hasMessages) return null;
  return (
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
            textClassName="text-left leading-tight font-normal text-foreground text-center"
            onPress={() => {
              void onSend(q);
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function AiScreen() {
  const {
    hasKey,
    messages,
    draftQuestion,
    isStreaming,
    errorMessage,
    toolStatus,
    actions,
    scroll,
    getMessageRenderInfo,
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
                onPress={actions.reset}
                disabled={!messages.length}
              />
            </View>
          )}
          <ScrollView
            ref={scroll.scrollViewRef}
            onLayout={scroll.onScrollViewLayout}
            className="flex-1 px-4 pt-4"
            contentContainerClassName="pb-8"
            style={defaultStyles.transparentBg}
          >
            <Empty hasKey={hasKey} hasMessages={messages.length > 0} onSend={actions.send} />
            {messages.map((m) => {
              const { displayContent, isLiveStreaming } = getMessageRenderInfo(m);
              return (
                <View
                  key={m.id}
                  onLayout={(event) => {
                    scroll.onMessageLayout(m.id, event);
                  }}
                  className={`mb-2 max-w-[85%] rounded-lg px-3 py-2 ${
                    m.role === 'user'
                      ? 'self-end bg-foreground dark:bg-foreground/40'
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
                        <MessageComponent
                          content={displayContent}
                          streaming={isLiveStreaming}
                          markdownStyle={markdownStyle}
                        />
                      )}
                </View>
              );
            })}

            {toolStatus && (
              <View className="my-1 flex-row items-center gap-1 px-1">
                <Brain size={15} className="text-muted-foreground" />
                <Text className="text-xs text-muted-foreground italic">{toolStatus}</Text>
              </View>
            )}
            {errorMessage && (
              <View className="my-4 rounded-lg bg-danger-500/10 px-3 py-2">
                <Text className="text-sm text-danger-500">{errorMessage}</Text>
              </View>
            )}
            {scroll.shouldShowBottomFiller && <View style={{ height: scroll.bottomFillerHeight }} />}
          </ScrollView>

          <View className="bg-background px-4 pb-safe-offset-2">
            <View className="relative">
              <Input
                variant="textarea"
                value={draftQuestion}
                onChangeText={actions.setDraft}
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
                  void actions.send();
                }}
                disabled={isStreaming || !draftQuestion.trim() || !hasKey}
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
