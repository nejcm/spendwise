import type { LayoutChangeEvent, ListRenderItemInfo, TextInput as NativeTextInput } from 'react-native';
import type { AiScope, ChatMessage } from './types';
import { format, isToday } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { KeyboardAvoidingView, KeyboardGestureArea } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderButton } from '@/components/page-header';
import {
  FocusAwareStatusBar,
  getPressedStyle,
  GhostButton,
  SolidButton,
  Text,
  useModalSheet,
  View,
} from '@/components/ui';
import { ArrowUp, Brain, Calendar, ChevronDown, ChevronLeft, SlidersHorizontal, Sparkle, SquarePen } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccounts } from '@/features/accounts/api';
import AssistantMessage from '@/features/ai/components/assistant-message';
import AssistantMessageWeb from '@/features/ai/components/assistant-message.web';
import { IS_WEB } from '@/lib/base';
import { cn } from '@/lib/cn';
import { getPeriodLabel } from '@/lib/date/labels';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { ScopeSheet } from './components/scope-sheet';
import { AI_INPUT_NATIVE_ID, PRESET_QUESTIONS } from './constants';
import { isSameAccountScope, resolveScopeAccounts } from './helpers';
import { DEFAULT_AI_SCOPE, useAiChatStore } from './store';
import { useChat } from './use-chat';

// markdown library not supported on web
const MessageComponent = IS_WEB ? AssistantMessageWeb : AssistantMessage;

function AiSetup({ hasKey }: { hasKey: boolean }) {
  const router = useRouter();
  return (
    <View className="flex-1 px-5">
      <View className="mt-[26px] size-14 items-center justify-center rounded-[18px] bg-primary">
        <Sparkle size={22} strokeWidth={2} colorClassName="accent-primary-foreground" />
      </View>
      <Text accessibilityRole="header" className="mt-[18px] text-[30px]/[34px] font-bold tracking-page-title">{translate(hasKey ? 'ai.chat_off_title' : 'ai.setup_required_title')}</Text>
      <Text className="mt-2 text-base/normal text-muted-foreground">{translate(hasKey ? 'ai.chat_off_body' : 'ai.setup_required_body')}</Text>
      <View className="mt-auto gap-1.5 pb-6">
        <SolidButton
          color="primary"
          size="lg"
          fullWidth
          className="rounded-full"
          label={translate('ai.setup_required_action')}
          onPress={() => router.push('/settings/ai')}
        />
        <GhostButton
          color="default"
          size="lg"
          fullWidth
          label={translate('ai.not_now')}
          onPress={() => goBackOrFallback(router)}
        />
      </View>
    </View>
  );
}

function ChatHeader({ hasKey, canStartNewChat, onNewChat }: { hasKey: boolean; canStartNewChat: boolean; onNewChat: () => void }) {
  const router = useRouter();
  const provider = useAppStore.use.aiProvider();

  return (
    <View className="h-12 flex-row items-center justify-between gap-2 px-5">
      <View className="w-14">
        <HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router)} />
      </View>
      <View className="min-w-0 flex-1 items-center">
        <Text accessibilityRole="header" numberOfLines={1} className={cn('text-header-title font-semibold', !hasKey && 'font-normal text-muted-foreground')}>
          {translate('ai.header_title')}
        </Text>
        {hasKey && (
          <View className="flex-row items-center gap-1.5">
            <View className="size-2 rounded-full bg-positive" />
            <Text numberOfLines={1} className="text-xs text-muted-foreground">
              {translate('ai.key_on_device', { provider: translate(`settings.provider_${provider}`) })}
            </Text>
          </View>
        )}
      </View>
      <View className="w-21 items-end">
        {hasKey && (
          <View className="flex-row items-center rounded-full bg-card p-0.5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translate('ai.new_chat')}
              accessibilityState={{ disabled: !canStartNewChat }}
              disabled={!canStartNewChat}
              onPress={onNewChat}
              style={getPressedStyle}
              className={cn('size-10 items-center justify-center', !canStartNewChat && 'opacity-40')}
            >
              <SquarePen size={18} strokeWidth={1.8} colorClassName="accent-foreground" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translate('ai.settings')}
              onPress={() => router.push('/settings/ai')}
              style={getPressedStyle}
              className="size-10 items-center justify-center"
            >
              <SlidersHorizontal size={18} strokeWidth={1.8} colorClassName="accent-foreground" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function chatTime(createdAt: number | undefined) {
  if (!createdAt) return null;
  return format(createdAt, isToday(createdAt) ? 'HH:mm' : 'MMM d, HH:mm');
}

function ScopeRow({ startedAt, onApply }: { startedAt: number | undefined; onApply: (scope: AiScope, accountsChanged: boolean) => void }) {
  const scope = useAiChatStore((s) => s.scope) ?? DEFAULT_AI_SCOPE;
  const { data: activeAccounts = [] } = useAccounts();
  const { ref, present, close } = useModalSheet();
  const { accounts, limited } = resolveScopeAccounts(activeAccounts, scope.accountIds);
  const accountsLabel = !limited
    ? translate('ai.scope_all_accounts')
    : accounts.length === 1 ? accounts[0].name : translate('ai.scope_accounts_count', { count: accounts.length });
  const periodLabel = getPeriodLabel(scope.period);
  const sheetScope: AiScope = { ...scope, accountIds: limited ? accounts.map((a) => a.id) : 'all' };
  const time = chatTime(startedAt);

  return (
    <View className="flex-row items-center justify-center gap-2 px-5 pt-4 pb-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('ai.scope_a11y', { period: periodLabel, accounts: accountsLabel })}
        onPress={() => present()}
        style={getPressedStyle}
        className="h-8 shrink flex-row items-center gap-1.5 rounded-full border border-accent-line px-3"
      >
        <Calendar size={14} strokeWidth={2} colorClassName="accent-foreground" />
        <Text numberOfLines={1} className="shrink text-meta font-medium">{`${periodLabel} · ${accountsLabel}`}</Text>
        <ChevronDown size={14} strokeWidth={2} colorClassName="accent-muted-foreground" />
      </Pressable>
      {time && <Text className="text-xs text-muted-foreground">{time}</Text>}
      <ScopeSheet
        ref={ref}
        scope={sheetScope}
        accounts={activeAccounts}
        onApply={(next) => {
          onApply(next, !isSameAccountScope(activeAccounts, sheetScope.accountIds, next.accountIds));
          close();
        }}
      />
    </View>
  );
}

function Intro() {
  return (
    <View className="flex-1 items-center justify-center px-8 py-10">
      <View className="size-12 items-center justify-center rounded-full bg-primary">
        <Sparkle size={18} strokeWidth={2} colorClassName="accent-primary-foreground" />
      </View>
      <Text className="mt-4 text-center text-row text-muted-foreground">{translate('ai.ask_prompt')}</Text>
    </View>
  );
}

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

  if (message.role === 'user') {
    return (
      <View onLayout={handleLayout} className="mx-5 mt-3 max-w-[80%] self-end rounded-card rounded-br-md bg-primary px-4 py-3">
        <Text className="text-row text-primary-foreground">{message.content}</Text>
      </View>
    );
  }

  return (
    <View onLayout={handleLayout} className="mx-5 mt-4 flex-row gap-2.5">
      <View className="size-[30px] items-center justify-center rounded-full bg-primary">
        <Sparkle size={13} strokeWidth={2.5} colorClassName="accent-primary-foreground" />
      </View>
      {isLiveStreaming && !displayContent
        ? <Skeleton height={44} className="flex-1 rounded-card rounded-tl-md" />
        : (
            <View className="min-w-0 flex-1 rounded-card rounded-tl-md bg-card px-4 py-3.5">
              {isLiveStreaming
                ? <Text className="text-row">{displayContent}</Text>
                : <MessageComponent content={displayContent} streaming={false} markdownStyle={markdownStyle} />}
            </View>
          )}
    </View>
  );
});

function SuggestedPrompts({ disabled, onSend }: { disabled: boolean; onSend: (question: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-2 px-4">
      {PRESET_QUESTIONS.map((q) => (
        <Pressable
          key={q}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onSend(q)}
          style={getPressedStyle}
          className={cn('h-[38px] justify-center rounded-full bg-card px-3.5', disabled && 'opacity-50')}
        >
          <Text className="text-sm">{q}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

type ChatFooterProps = {
  bottomFillerHeight: number;
  draftQuestion: string;
  errorMessage: string | null;
  inputRef: React.Ref<NativeTextInput | null>;
  isStreaming: boolean;
  onComposerLayout: (event: LayoutChangeEvent) => void;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  onSendPrompt: (question: string) => void;
  shouldShowBottomFiller: boolean;
  toolStatus: string | null;
};

function ChatFooter({
  bottomFillerHeight,
  draftQuestion,
  errorMessage,
  inputRef,
  isStreaming,
  onComposerLayout,
  onDraftChange,
  onSend,
  onSendPrompt,
  shouldShowBottomFiller,
  toolStatus,
}: ChatFooterProps) {
  const bottomFillerStyle = React.useMemo(
    () => ({ height: bottomFillerHeight }),
    [bottomFillerHeight],
  );
  const canSend = !isStreaming && !!draftQuestion.trim();

  return (
    <View>
      {toolStatus && (
        <View className="mx-5 my-1 flex-row items-center gap-1 px-1">
          <Brain size={15} colorClassName="accent-muted-foreground" />
          <Text className="text-xs text-muted-foreground italic">{toolStatus}</Text>
        </View>
      )}
      {errorMessage && (
        <View className="mx-5 my-2 rounded-tile bg-negative/10 px-3 py-2">
          <Text className="text-meta text-negative">{errorMessage}</Text>
        </View>
      )}
      {shouldShowBottomFiller && <View style={bottomFillerStyle} />}
      <View onLayout={onComposerLayout} className="gap-2.5 pt-2 pb-3">
        <SuggestedPrompts disabled={isStreaming} onSend={onSendPrompt} />
        <View className="mx-4 min-h-[58px] flex-row items-end gap-2 rounded-[29px] bg-card py-[7px] pr-[7px] pl-5">
          <TextInput
            ref={inputRef}
            nativeID={AI_INPUT_NATIVE_ID}
            value={draftQuestion}
            onChangeText={onDraftChange}
            placeholder={translate('ai.input_placeholder')}
            placeholderTextColorClassName="accent-muted-foreground"
            accessibilityLabel={translate('ai.message')}
            autoCapitalize="sentences"
            autoCorrect
            multiline
            className="max-h-32 min-w-0 flex-1 self-center py-2 font-sans text-base text-foreground"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('ai.send')}
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={onSend}
            style={getPressedStyle}
            className={cn('size-11 items-center justify-center rounded-full bg-primary', !canSend && 'opacity-40')}
          >
            <ArrowUp size={18} strokeWidth={2.2} colorClassName="accent-primary-foreground" />
          </Pressable>
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
    isChatOn,
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
  const { applyScope, reset, send, setDraft } = actions;
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
    <View className="flex-1 bg-background">
      <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-wash to-background" />
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
          <View className="pt-2">
            <ChatHeader hasKey={isChatOn} canStartNewChat={messages.length > 0} onNewChat={reset} />
          </View>
          {isChatOn
            ? (
                <>
                  <ScopeRow startedAt={messages[0]?.createdAt} onApply={applyScope} />
                  <FlatList
                    ref={scrollViewRef}
                    data={messages}
                    extraData={streamedAssistantContent}
                    renderItem={renderMessage}
                    keyExtractor={(message) => message.id}
                    onContentSizeChange={onContentSizeChange}
                    onLayout={onScrollViewLayout}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={Intro}
                    contentContainerStyle={styles.listContent}
                    style={styles.list}
                  />
                  <ChatFooter
                    bottomFillerHeight={bottomFillerHeight}
                    draftQuestion={draftQuestion}
                    errorMessage={errorMessage}
                    inputRef={inputRef}
                    isStreaming={isStreaming}
                    onComposerLayout={onComposerLayout}
                    onDraftChange={setDraft}
                    onSend={sendDraft}
                    onSendPrompt={sendQuestion}
                    shouldShowBottomFiller={shouldShowBottomFiller}
                    toolStatus={toolStatus}
                  />
                </>
              )
            : <AiSetup hasKey={hasKey} />}
        </KeyboardGestureArea>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  list: {
    ...defaultStyles.transparentBg,
    flex: 1,
  },
  gestureArea: {
    flex: 1,
  },
});
