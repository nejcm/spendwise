import type { LayoutChangeEvent, ListRenderItemInfo, TextInput as NativeTextInput } from 'react-native';
import type { ChatMessage } from './types';
import { Link } from 'expo-router';
import * as React from 'react';
import { FlatList, Keyboard, StyleSheet } from 'react-native';
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
import { Skeleton } from '@/components/ui/skeleton';
import AssistantMessage from '@/features/ai/components/assistant-message';
import AssistantMessageWeb from '@/features/ai/components/assistant-message.web';
import { IS_WEB } from '@/lib/base';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { AI_INPUT_NATIVE_ID, PRESET_QUESTIONS } from './constants';
import { useChat } from './use-chat';

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
      <Text className="mb-6 text-center">{translate('ai.ask_prompt')}</Text>
      <View className="gap-y-3 2xs:px-2">
        {PRESET_QUESTIONS.map((q) => (
          <SolidButton
            key={q}
            color="secondary"
            size="sm"
            label={q}
            className="h-auto rounded-lg px-3 py-2"
            textClassName="text-left leading-tight font-normal text-foreground"
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
  inputRef: React.Ref<NativeTextInput | null>;
  isStreaming: boolean;
  onComposerLayout: (event: LayoutChangeEvent) => void;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  shouldShowBottomFiller: boolean;
  toolStatus: string | null;
};

type ChatMessageRowProps = {
  displayContent: string;
  isLiveStreaming: boolean;
  markdownStyle: React.ComponentProps<typeof MessageComponent>['markdownStyle'];
  message: ChatMessage;
  onMessageLayout: (messageId: string, event: LayoutChangeEvent) => void;
};

const ChatMessageRow = React.memo(({
  displayContent,
  isLiveStreaming,
  markdownStyle,
  message,
  onMessageLayout,
}: ChatMessageRowProps) => {
  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    onMessageLayout(message.id, event);
  }, [message.id, onMessageLayout]);
  const content = React.useMemo(() => {
    if (!displayContent) return null;
    if (message.role === 'user') {
      return <Text className="text-sm text-background">{message.content}</Text>;
    }
    if (isLiveStreaming) {
      return <Text className="text-sm text-foreground">{displayContent}</Text>;
    }
    return (
      <MessageComponent
        content={displayContent}
        streaming={false}
        markdownStyle={markdownStyle}
      />
    );
  }, [displayContent, isLiveStreaming, markdownStyle, message.content, message.role]);

  if (isLiveStreaming && !displayContent) return <Skeleton height={30} width={200} className="mx-4 mb-2" />;
  return (
    <View
      onLayout={handleLayout}
      className={`mx-4 mb-2 max-w-[85%] rounded-lg px-3 py-2 ${
        message.role === 'user'
          ? 'self-end bg-foreground'
          : 'self-start bg-muted'
      }`}
    >
      {content}
    </View>
  );
});

function ChatFooter({
  bottomFillerHeight,
  draftQuestion,
  errorMessage,
  hasKey,
  inputRef,
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
            ref={inputRef}
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
  const inputRef = React.useRef<NativeTextInput | null>(null);
  const [composerGestureOffset, setComposerGestureOffset] = React.useState(0);
  const {
    hasKey,
    messages,
    draftQuestion,
    isStreaming,
    streamedAssistantContent,
    errorMessage,
    toolStatus,
    actions,
    scroll,
    getMessageRenderInfo,
    markdownStyle,
  } = useChat();
  const {
    bottomFillerHeight,
    onContentSizeChange,
    onMessageLayout,
    onScrollViewLayout,
    scrollViewRef,
    shouldShowBottomFiller,
  } = scroll;
  const { reset, send, setDraft } = actions;
  const hasMessages = messages.length > 0;
  const dismissComposer = React.useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);
  const sendQuestion = React.useCallback((question: string) => {
    send(question);
    dismissComposer();
  }, [dismissComposer, send]);
  const sendDraft = React.useCallback(() => {
    send();
    dismissComposer();
  }, [dismissComposer, send]);
  const onComposerLayout = React.useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setComposerGestureOffset((current) => current === height ? current : height);
  }, []);
  const listEmpty = React.useMemo(
    () => (
      <View className="mx-4">
        <Empty
          hasKey={hasKey}
          hasMessages={hasMessages}
          onSend={sendQuestion}
        />
      </View>
    ),
    [hasKey, hasMessages, sendQuestion],
  );

  const renderMessage = React.useCallback(
    ({ item: m }: ListRenderItemInfo<ChatMessage>) => {
      const { displayContent, isLiveStreaming } = getMessageRenderInfo(m);
      return (
        <ChatMessageRow
          displayContent={displayContent}
          isLiveStreaming={isLiveStreaming}
          markdownStyle={markdownStyle}
          message={m}
          onMessageLayout={onMessageLayout}
        />
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
          style={styles.keyboard}
        >
          <FocusAwareStatusBar />
          <KeyboardGestureArea
            interpolator="ios"
            offset={composerGestureOffset}
            style={styles.gestureArea}
            textInputNativeID={AI_INPUT_NATIVE_ID}
          >
            <ChatHeader
              hasNewChat={hasKey && messages.length > 0}
              onNewChat={reset}
            />
            <FlatList
              ref={scrollViewRef}
              data={messages}
              extraData={streamedAssistantContent}
              renderItem={renderMessage}
              keyExtractor={(message) => message.id}
              onContentSizeChange={onContentSizeChange}
              onLayout={onScrollViewLayout}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={listEmpty}
              contentContainerStyle={styles.listContent}
              style={styles.list}
            />
            <ChatFooter
              bottomFillerHeight={bottomFillerHeight}
              draftQuestion={draftQuestion}
              errorMessage={errorMessage}
              hasKey={hasKey}
              inputRef={inputRef}
              isStreaming={isStreaming}
              onComposerLayout={onComposerLayout}
              onDraftChange={setDraft}
              onSend={sendDraft}
              shouldShowBottomFiller={shouldShowBottomFiller}
              toolStatus={toolStatus}
            />
          </KeyboardGestureArea>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  list: {
    ...defaultStyles.transparentBg,
    flex: 1,
  },
  gestureArea: {
    flex: 1,
  },
});
