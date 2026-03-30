import type { LayoutChangeEvent, ScrollView as RNScrollView } from 'react-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { ChatMessage, UseChatReturn } from '@/features/ai/types';
import { useSQLiteContext } from 'expo-sqlite';

import * as React from 'react';
import { streamAskWithTools } from '@/features/ai/service';
import { clearAiChat, setAiDraftQuestion, setAiMessages, useAiChatStore } from '@/features/ai/store';
import { captureError } from '@/lib/analytics';
import { translate } from '@/lib/i18n';
import { generateId } from '@/lib/sqlite';
import { selectIsAiEnabled, useAppStore } from '@/lib/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { getMarkdownStyle } from './helpers';

const TOP_OFFSET = 8;
const FALLBACK_FILLER_RATIO = 0.7;

export type ChatState = {
  isStreaming: boolean;
  streamingAssistantId: string | null;
  streamedAssistantContent: string;
  errorMessage: string | null;
  toolStatus: string | null;
  lastSubmittedUserMessageId: string | null;
  viewportHeight: number;
};

function initialState(): ChatState {
  return {
    isStreaming: false,
    streamingAssistantId: null,
    streamedAssistantContent: '',
    errorMessage: null,
    toolStatus: null,
    lastSubmittedUserMessageId: null,
    viewportHeight: 0,
  };
}

export function useChat(): UseChatReturn {
  const db = useSQLiteContext();
  const theme = useThemeConfig();
  const messages = useAiChatStore.use.messages();
  const draftQuestion = useAiChatStore.use.draftQuestion();
  const isAiEnabled = useAppStore(selectIsAiEnabled);
  const inFlightRequestRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isMountedRef = React.useRef(true);
  const [chatState, setChatState] = React.useState<ChatState>(initialState);
  const scrollViewRef = React.useRef<RNScrollView>(null);
  const messageLayoutsRef = React.useRef<Record<string, { y: number; height: number }>>({});
  const pendingScrollUserMessageIdRef = React.useRef<string | null>(null);

  const reset = React.useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    inFlightRequestRef.current = false;
    setChatState((prev) => ({
      ...initialState(),
      viewportHeight: prev.viewportHeight,
    }));
    clearAiChat();
  }, []);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const send = React.useCallback((presetQuestion?: string) => {
    const sourceQuestion = presetQuestion ?? draftQuestion;
    const trimmed = sourceQuestion.trim();
    if (!trimmed || chatState.isStreaming || inFlightRequestRef.current) return;

    const existingMessages = useAiChatStore.getState().messages;
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
    };
    const assistantPlaceholder: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
    };

    const currentMessages = [...existingMessages, userMessage, assistantPlaceholder];

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    inFlightRequestRef.current = true;
    setChatState((prev) => ({
      ...prev,
      errorMessage: null,
      toolStatus: null,
      lastSubmittedUserMessageId: userMessage.id,
      streamingAssistantId: assistantPlaceholder.id,
      streamedAssistantContent: '',
      isStreaming: true,
    }));

    setAiMessages(currentMessages);
    setAiDraftQuestion('');

    void (async () => {
      try {
        const finalContent = await streamAskWithTools({
          messages: [...existingMessages, userMessage],
          db,
          onToken: (token) => {
            if (!isMountedRef.current) return;
            setChatState((prev) => ({
              ...prev,
              toolStatus: null,
              streamedAssistantContent: prev.streamedAssistantContent + token,
            }));
          },
          onToolStatus: (status) => {
            if (!isMountedRef.current) return;
            setChatState((prev) => ({ ...prev, toolStatus: status }));
          },
          signal: controller.signal,
        });

        if (!isMountedRef.current) return;

        const finalMessages = currentMessages.map((m) => (
          m.id === assistantPlaceholder.id
            ? { ...m, content: finalContent }
            : m
        ));
        setAiMessages(finalMessages);
      }
      catch (err) {
        if (controller.signal.aborted) return;

        if (!isMountedRef.current) return;

        if (err instanceof Error) {
          captureError(err, { context: 'ai-chat' });
        }

        const message = err instanceof Error
          ? err.message
          : translate('ai.contact_error');
        setChatState((prev) => ({ ...prev, errorMessage: message }));

        // Remove the placeholder assistant message; keep the user's question.
        setAiMessages([...existingMessages, userMessage]);
      }
      finally {
        // If a newer request replaced the active AbortController, don't clobber its UI state.
        if (abortControllerRef.current === controller) {
          inFlightRequestRef.current = false;
          abortControllerRef.current = null;

          if (isMountedRef.current) {
            setChatState((prev) => ({
              ...prev,
              isStreaming: false,
              streamingAssistantId: null,
              streamedAssistantContent: '',
              toolStatus: null,
            }));
          }
        }
      }
    })();
  }, [db, chatState.isStreaming, draftQuestion]);

  const markdownStyle = React.useMemo<MarkdownStyle>(
    () => getMarkdownStyle(theme.dark),
    [theme.dark],
  );

  // Streaming content resolution
  const getMessageRenderInfo = React.useCallback(
    (message: ChatMessage) => ({
      displayContent: message.id === chatState.streamingAssistantId
        ? chatState.streamedAssistantContent
        : message.content,
      isLiveStreaming: chatState.isStreaming && message.id === chatState.streamingAssistantId,
    }),
    [
      chatState.streamingAssistantId,
      chatState.streamedAssistantContent,
      chatState.isStreaming,
    ],
  );

  // Scroll management
  const lastMessage = messages.at(-1);
  const lastAssistant = lastMessage?.role === 'assistant' ? lastMessage : null;
  const shouldShowBottomFiller
    = lastMessage?.role === 'user'
      || (Boolean(lastAssistant) && chatState.isStreaming && lastAssistant?.id === chatState.streamingAssistantId);
  const fillerAnchorMessageId = shouldShowBottomFiller ? lastMessage?.id : null;
  const measuredAnchorHeight = fillerAnchorMessageId
    ? messageLayoutsRef.current[fillerAnchorMessageId]?.height
    : undefined;
  const fallbackBottomFillerHeight = chatState.viewportHeight > 0 ? chatState.viewportHeight * FALLBACK_FILLER_RATIO : 0;
  const bottomFillerHeight = shouldShowBottomFiller
    ? Math.max(0, measuredAnchorHeight !== undefined
        ? chatState.viewportHeight - measuredAnchorHeight - TOP_OFFSET
        : fallbackBottomFillerHeight)
    : 0;

  const scrollUserMessageToTop = React.useCallback((messageId: string) => {
    const targetY = messageLayoutsRef.current[messageId]?.y;
    if (targetY === undefined) return;
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, targetY - TOP_OFFSET),
      animated: true,
    });
    pendingScrollUserMessageIdRef.current = null;
  }, []);

  React.useEffect(() => {
    if (!chatState.lastSubmittedUserMessageId) return;
    pendingScrollUserMessageIdRef.current = chatState.lastSubmittedUserMessageId;
    scrollUserMessageToTop(chatState.lastSubmittedUserMessageId);
  }, [chatState.lastSubmittedUserMessageId, scrollUserMessageToTop]);

  const onScrollViewLayout = React.useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setChatState((prev) => (prev.viewportHeight === height ? prev : { ...prev, viewportHeight: height }));
  }, []);

  const onMessageLayout = React.useCallback((messageId: string, event: LayoutChangeEvent) => {
    messageLayoutsRef.current[messageId] = {
      y: event.nativeEvent.layout.y,
      height: event.nativeEvent.layout.height,
    };
    if (pendingScrollUserMessageIdRef.current === messageId) {
      scrollUserMessageToTop(messageId);
    }
  }, [scrollUserMessageToTop]);

  return {
    hasKey: isAiEnabled,
    messages,
    draftQuestion,
    ...chatState,
    actions: {
      send,
      setDraft: setAiDraftQuestion,
      reset,
    },
    scroll: {
      scrollViewRef,
      onScrollViewLayout,
      onMessageLayout,
      shouldShowBottomFiller,
      bottomFillerHeight,
    },
    getMessageRenderInfo,
    markdownStyle,
  };
}
