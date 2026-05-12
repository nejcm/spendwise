import type { LayoutChangeEvent, ListRenderItemInfo } from 'react-native';
import type { ChatMessage } from './types';
import { Link } from 'expo-router';
import * as React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { KeyboardAvoidingView, KeyboardGestureArea } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/screen-header';
import {
  FocusAwareStatusBar,
  Input,
  SolidButton,
  Text,
  View,
} from '@/components/ui';
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
const AI_INPUT_NATIVE_ID = 'ai-chat-input';

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
          <Link
            href="/settings/ai"
            className="mx-1 font-medium text-foreground underline"
          >
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
      <Text className="mb-2 text-center">{translate('ai.ask_prompt')}</Text>
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

type ChatHeaderProps = {
  hasNewChat: boolean;
  onNewChat: () => void;
};
function ChatHeader({ hasNewChat, onNewChat }: ChatHeaderProps) {
  return (
    <View>
      <View className="flex-row items-center justify-between gap-2 border-b border-border px-4 py-2">
        <BackButton size="sm" />
        {hasNewChat && (
          <SolidButton
            color="primary"
            size="xs"
            label={translate('ai.new_chat')}
            iconLeft={(
              <Plus
                colorClassName="accent-primary-foreground"
                className="mr-1"
                size={15}
              />
            )}
            onPress={onNewChat}
          />
        )}
      </View>
      <View className="h-4" />
    </View>
  );
}

type ChatFooterProps = {
  bottomFillerHeight: number;
  draftQuestion: string;
  errorMessage: string | null;
  hasKey: boolean;
  isStreaming: boolean;
  onComposerLayout: (event: LayoutChangeEvent) => void;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  shouldShowBottomFiller: boolean;
  toolStatus: string | null;
};
function ChatFooter({
  bottomFillerHeight,
  draftQuestion,
  errorMessage,
  hasKey,
  isStreaming,
  onComposerLayout,
  onDraftChange,
  onSend,
  shouldShowBottomFiller,
  toolStatus,
}: ChatFooterProps) {
  const bottomFillerStyle = React.useMemo(
    () => ({ height: bottomFillerHeight }),
    [bottomFillerHeight],
  );

  return (
    <View>
      {toolStatus && (
        <View className="mx-4 my-1 flex-row items-center gap-1 px-1">
          <Brain size={15} className="text-muted-foreground" />
          <Text className="text-xs text-muted-foreground italic">
            {toolStatus}
          </Text>
        </View>
      )}
      {errorMessage && (
        <View className="m-4 rounded-lg bg-danger-500/10 px-3 py-2">
          <Text className="text-sm text-danger-500">{errorMessage}</Text>
        </View>
      )}
      {shouldShowBottomFiller && (
        <View style={bottomFillerStyle} />
      )}
      <View
        onLayout={onComposerLayout}
        className="bg-background px-4 py-2"
      >
        <View className="relative">
          <Input
            nativeID={AI_INPUT_NATIVE_ID}
            variant="textarea"
            value={draftQuestion}
            onChangeText={onDraftChange}
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
            onPress={onSend}
            disabled={isStreaming || !draftQuestion.trim() || !hasKey}
            className="absolute right-2 bottom-2 rounded-full"
          >
            <SendHorizonal colorClassName="accent-background" size={20} />
          </IconButton>
        </View>
      </View>
    </View>
  );
}

export function AiScreen() {
  const { bottom } = useSafeAreaInsets();
  const [composerGestureOffset, setComposerGestureOffset] = React.useState(0);
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
  const {
    bottomFillerHeight,
    onMessageLayout,
    onScrollViewLayout,
    scrollViewRef,
    shouldShowBottomFiller,
  } = scroll;
  const { reset, send, setDraft } = actions;
  const onComposerLayout = React.useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setComposerGestureOffset((current) => current === height ? current : height);
  }, []);
  const listEmpty = React.useMemo(
    () => (
      <View className="mx-4">
        <Empty
          hasKey={hasKey}
          hasMessages={messages.length > 0}
          onSend={send}
        />
      </View>
    ),
    [hasKey, messages.length, send],
  );
  const listHeader = React.useMemo(
    () => (
      <ChatHeader
        hasNewChat={hasKey && messages.length > 0}
        onNewChat={reset}
      />
    ),
    [hasKey, messages.length, reset],
  );
  const listFooter = React.useMemo(
    () => (
      <ChatFooter
        bottomFillerHeight={bottomFillerHeight}
        draftQuestion={draftQuestion}
        errorMessage={errorMessage}
        hasKey={hasKey}
        isStreaming={isStreaming}
        onComposerLayout={onComposerLayout}
        onDraftChange={setDraft}
        onSend={send}
        shouldShowBottomFiller={shouldShowBottomFiller}
        toolStatus={toolStatus}
      />
    ),
    [
      bottomFillerHeight,
      draftQuestion,
      errorMessage,
      hasKey,
      isStreaming,
      onComposerLayout,
      send,
      setDraft,
      shouldShowBottomFiller,
      toolStatus,
    ],
  );
  const renderMessage = React.useCallback(
    ({ item: m }: ListRenderItemInfo<ChatMessage>) => {
      const { displayContent, isLiveStreaming } = getMessageRenderInfo(m);
      return (
        <View
          onLayout={(event) => {
            onMessageLayout(m.id, event);
          }}
          className={`mx-4 mb-2 max-w-[85%] rounded-lg px-3 py-2 ${
            m.role === 'user'
              ? 'self-end bg-foreground'
              : 'self-start bg-muted'
          }`}
        >
          {m.role === 'user'
            ? (
                <Text className="text-sm text-background">{m.content}</Text>
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
    },
    [getMessageRenderInfo, markdownStyle, onMessageLayout],
  );

  return (
    <>
      <View className="flex-1 bg-background">
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={bottom}
          style={{ flex: 1 }}
        >
          <FocusAwareStatusBar />
          <KeyboardGestureArea
            interpolator="ios"
            offset={composerGestureOffset}
            style={styles.gestureArea}
            textInputNativeID={AI_INPUT_NATIVE_ID}
          >
            <FlatList
              ref={scrollViewRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(message) => message.id}
              onLayout={onScrollViewLayout}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={listEmpty}
              ListFooterComponent={listFooter}
              ListFooterComponentStyle={styles.listFooter}
              ListHeaderComponent={listHeader}
              style={styles.chatList}
              contentContainerStyle={styles.chatContent}
            />
          </KeyboardGestureArea>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  chatContent: {
    flexGrow: 1,
  },
  chatList: {
    ...defaultStyles.transparentBg,
    flex: 1,
  },
  gestureArea: {
    flex: 1,
  },
  listFooter: {
    marginTop: 'auto',
  },
});
