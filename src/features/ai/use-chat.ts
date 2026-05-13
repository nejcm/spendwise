import type { FlatList, LayoutChangeEvent } from 'react-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { ChatMessage, UseChatReturn } from '@/features/ai/types';
import { useSQLiteContext } from 'expo-sqlite';

import * as React from 'react';
import { streamAskWithTools } from '@/features/ai/service';
import { clearAiChat, setAiDraftQuestion, setAiMessages, useAiChatStore } from '@/features/ai/store';
import { captureError } from '@/lib/analytics';
import { translate } from '@/lib/i18n';
import { generateId } from '@/lib/sqlite';
import { selectIsAiEnabled, useAppStore } from '@/lib/store/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { getMarkdownStyle } from './helpers';

const TOP_OFFSET = 8;
const FALLBACK_FILLER_RATIO = 0.7;
const STREAM_FLUSH_INTERVAL_MS = 50;

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

function useStreamedContentFlush(
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>,
) {
  const streamedAssistantContentRef = React.useRef('');
  const lastStreamFlushAtRef = React.useRef(0);
  const streamFlushTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStreamFlushTimeout = React.useCallback(() => {
    if (!streamFlushTimeoutRef.current) return;
    clearTimeout(streamFlushTimeoutRef.current);
    streamFlushTimeoutRef.current = null;
  }, []);

  const flushStreamedContent = React.useCallback(() => {
    lastStreamFlushAtRef.current = Date.now();
    streamFlushTimeoutRef.current = null;
    setChatState((prev) => ({
      ...prev,
      toolStatus: null,
      streamedAssistantContent: streamedAssistantContentRef.current,
    }));
  }, [setChatState]);

  const scheduleStreamFlush = React.useCallback(() => {
    if (streamFlushTimeoutRef.current) return;

    const elapsed = Date.now() - lastStreamFlushAtRef.current;
    if (elapsed >= STREAM_FLUSH_INTERVAL_MS) {
      flushStreamedContent();
      return;
    }

    streamFlushTimeoutRef.current = setTimeout(
      flushStreamedContent,
      STREAM_FLUSH_INTERVAL_MS - elapsed,
    );
  }, [flushStreamedContent]);

  const resetStreamedContent = React.useCallback(() => {
    clearStreamFlushTimeout();
    streamedAssistantContentRef.current = '';
    lastStreamFlushAtRef.current = 0;
  }, [clearStreamFlushTimeout]);

  const appendStreamToken = React.useCallback((token: string) => {
    streamedAssistantContentRef.current += token;
    scheduleStreamFlush();
  }, [scheduleStreamFlush]);

  return {
    appendStreamToken,
    clearStreamFlushTimeout,
    resetStreamedContent,
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
  const scrollViewRef = React.useRef<FlatList<ChatMessage>>(null);
  const messageLayoutsRef = React.useRef<Record<string, { y: number; height: number }>>({});
  const pendingInitialScrollToEndRef = React.useRef(true);
  const pendingScrollToEndRef = React.useRef(false);
  const {
    appendStreamToken,
    clearStreamFlushTimeout,
    resetStreamedContent,
  } = useStreamedContentFlush(setChatState);

  const reset = React.useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    inFlightRequestRef.current = false;
    setChatState((prev) => ({
      ...initialState(),
      viewportHeight: prev.viewportHeight,
    }));
    clearAiChat();
  }, [setChatState]);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      clearStreamFlushTimeout();
    };
  }, [clearStreamFlushTimeout]);

  const send = React.useCallback((presetQuestion?: string) => {
    const sourceQuestion = presetQuestion ?? draftQuestion;
    const trimmed = sourceQuestion?.trim();
    if (!trimmed.length || chatState.isStreaming || inFlightRequestRef.current) return;

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
    resetStreamedContent();
    setChatState((prev) => ({
      ...prev,
      errorMessage: null,
      toolStatus: null,
      lastSubmittedUserMessageId: userMessage.id,
      streamingAssistantId: assistantPlaceholder.id,
      streamedAssistantContent: '',
      isStreaming: true,
    }));

    pendingInitialScrollToEndRef.current = false;
    pendingScrollToEndRef.current = true;
    setAiMessages(currentMessages);
    setAiDraftQuestion('');

    void (async () => {
      try {
        const finalContent = await streamAskWithTools({
          messages: [...existingMessages, userMessage],
          db,
          onToken: (token) => {
            if (!isMountedRef.current) return;
            appendStreamToken(token);
          },
          onToolStatus: (status) => {
            if (!isMountedRef.current) return;
            setChatState((prev) => ({ ...prev, toolStatus: status }));
          },
          signal: controller.signal,
        });

        if (!isMountedRef.current) return;
        clearStreamFlushTimeout();

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
          clearStreamFlushTimeout();

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
  }, [
    appendStreamToken,
    clearStreamFlushTimeout,
    db,
    chatState.isStreaming,
    draftQuestion,
    resetStreamedContent,
    setChatState,
  ]);

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
  const shouldShowBottomFiller = lastMessage?.role === 'user';
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

  const scrollToEnd = React.useCallback((animated: boolean) => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const onContentSizeChange = React.useCallback(() => {
    const shouldScrollToInitialMessages = pendingInitialScrollToEndRef.current && messages.length > 0;
    const shouldScrollToSentMessages = pendingScrollToEndRef.current;
    if (!shouldScrollToInitialMessages && !shouldScrollToSentMessages) return;

    pendingInitialScrollToEndRef.current = false;
    if (shouldScrollToSentMessages) {
      pendingScrollToEndRef.current = false;
    }
    scrollToEnd(!shouldScrollToInitialMessages);
  }, [messages.length, scrollToEnd]);

  const onScrollViewLayout = React.useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setChatState((prev) => (prev.viewportHeight === height ? prev : { ...prev, viewportHeight: height }));
  }, [setChatState]);

  const onMessageLayout = React.useCallback((messageId: string, event: LayoutChangeEvent) => {
    messageLayoutsRef.current[messageId] = {
      y: event.nativeEvent.layout.y,
      height: event.nativeEvent.layout.height,
    };
  }, []);

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
      onContentSizeChange,
      onScrollViewLayout,
      onMessageLayout,
      shouldShowBottomFiller,
      bottomFillerHeight,
    },
    getMessageRenderInfo,
    markdownStyle,
  };
}
