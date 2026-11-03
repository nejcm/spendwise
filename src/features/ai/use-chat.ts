import type { FlatList, LayoutChangeEvent } from 'react-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { AiScope, ChatMessage, UseChatReturn, WriteAction } from '@/features/ai/types';
import { useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import * as React from 'react';
import { hideSnackbar, showSnackbar } from '@/components/ui/snackbar';
import { streamAskWithTools } from '@/features/ai/service';
import { clearAiChat, getAiScope, setAiDraftQuestion, setAiMessages, setAiScope, useAiChatStore } from '@/features/ai/store';
import { captureError } from '@/lib/analytics';
import { translate } from '@/lib/i18n';
import { generateId } from '@/lib/sqlite';
import { selectIsAiEnabled, selectIsAiFeatureOn, useAppStore } from '@/lib/store/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { getMarkdownStyle } from './helpers';

const TOP_OFFSET = 8;
const FALLBACK_FILLER_RATIO = 0.7;
const STREAM_FLUSH_INTERVAL_MS = 50;

let undoableChat: ChatMessage[] | null = null;

function updateAiMessages(update: (messages: ChatMessage[]) => ChatMessage[]) {
  setAiMessages(update(useAiChatStore.getState().messages));
}

function clearChatHistory(undoable: boolean) {
  const cleared = useAiChatStore.getState().messages.filter((m) => m.content);
  clearAiChat();
  if (!undoable) {
    if (undoableChat) hideSnackbar();
    undoableChat = null;
    return;
  }
  if (cleared.length === 0) return;
  undoableChat = cleared;
  showSnackbar({
    title: translate('ai.chat_cleared'),
    undo: () => {
      if (undoableChat !== cleared) return;
      undoableChat = null;
      updateAiMessages((messages) => [...cleared, ...messages]);
    },
  });
}

export type ChatState = {
  isStreaming: boolean;
  streamingAssistantId: string | null;
  streamedAssistantContent: string;
  errorMessage: string | null;
  toolStatus: string | null;
  pendingWrite: WriteAction | null;
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
    pendingWrite: null,
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

/** One write awaits the user at a time; it settles once, and aborting the request cancels it. */
function usePendingWrite(setChatState: React.Dispatch<React.SetStateAction<ChatState>>) {
  // Lives only in memory, so a restored chat can never re-trigger a write.
  const settleRef = React.useRef<((confirmed: boolean) => void) | null>(null);

  const requestWrite = React.useCallback((action: WriteAction, signal: AbortSignal) => new Promise<boolean>((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }
    const settle = (confirmed: boolean) => {
      if (settleRef.current !== settle) return;
      settleRef.current = null;
      signal.removeEventListener('abort', cancel);
      setChatState((prev) => ({ ...prev, pendingWrite: null }));
      resolve(confirmed);
    };
    const cancel = () => settle(false);
    settleRef.current = settle;
    signal.addEventListener('abort', cancel);
    setChatState((prev) => ({ ...prev, pendingWrite: action }));
  }), [setChatState]);

  const confirmWrite = React.useCallback(() => settleRef.current?.(true), []);
  const cancelWrite = React.useCallback(() => settleRef.current?.(false), []);

  return { requestWrite, confirmWrite, cancelWrite };
}

function useMessageRenderInfo({ isStreaming, pendingWrite, streamedAssistantContent, streamingAssistantId }: ChatState) {
  return React.useCallback(
    (message: ChatMessage) => ({
      displayContent: message.id === streamingAssistantId
        ? streamedAssistantContent
        : message.content,
      isLiveStreaming: isStreaming && message.id === streamingAssistantId,
      pendingWrite: message.id === streamingAssistantId ? pendingWrite : null,
    }),
    [isStreaming, pendingWrite, streamedAssistantContent, streamingAssistantId],
  );
}

export function useChat(): UseChatReturn {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const theme = useThemeConfig();
  const messages = useAiChatStore.use.messages();
  const draftQuestion = useAiChatStore.use.draftQuestion();
  const isAiEnabled = useAppStore(selectIsAiEnabled);
  const isChatOn = useAppStore(selectIsAiFeatureOn('chat'));
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
  const { requestWrite, confirmWrite, cancelWrite } = usePendingWrite(setChatState);

  const clearChat = React.useCallback((undoable: boolean) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    inFlightRequestRef.current = false;
    setChatState((prev) => ({
      ...initialState(),
      viewportHeight: prev.viewportHeight,
    }));
    clearChatHistory(undoable);
  }, [setChatState]);

  const reset = React.useCallback(() => clearChat(true), [clearChat]);

  const applyScope = React.useCallback((scope: AiScope, accountsChanged: boolean) => {
    setAiScope(scope);
    // Earlier answers hold data from accounts the new scope excludes; don't resend or restore them.
    if (accountsChanged) clearChat(false);
  }, [clearChat]);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      clearStreamFlushTimeout();
    };
  }, [clearStreamFlushTimeout]);

  React.useEffect(() => {
    if (!isChatOn) abortControllerRef.current?.abort();
  }, [isChatOn]);

  const send = React.useCallback((presetQuestion?: string) => {
    const sourceQuestion = presetQuestion ?? draftQuestion;
    const trimmed = sourceQuestion?.trim();
    if (!isChatOn || !trimmed.length || chatState.isStreaming || inFlightRequestRef.current) return;

    const existingMessages = useAiChatStore.getState().messages;
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    };
    const assistantPlaceholder: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
    };

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
    setAiMessages([...existingMessages, userMessage, assistantPlaceholder]);
    setAiDraftQuestion('');

    void (async () => {
      try {
        const finalContent = await streamAskWithTools({
          messages: [...existingMessages, userMessage],
          db,
          queryClient,
          scope: getAiScope(),
          confirmWrite: (action) => requestWrite(action, controller.signal),
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

        updateAiMessages((messages) => messages.map((m) => (
          m.id === assistantPlaceholder.id
            ? { ...m, content: finalContent }
            : m
        )));
      }
      catch (err) {
        updateAiMessages((messages) => messages.filter((m) => m.id !== assistantPlaceholder.id));
        if (controller.signal.aborted || !isMountedRef.current) return;

        if (err instanceof Error) {
          captureError(err, { context: 'ai-chat' });
        }

        const message = err instanceof Error
          ? err.message
          : translate('ai.contact_error');
        setChatState((prev) => ({ ...prev, errorMessage: message }));
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
    isChatOn,
    queryClient,
    requestWrite,
    resetStreamedContent,
    setChatState,
  ]);

  const markdownStyle = React.useMemo<MarkdownStyle>(
    () => getMarkdownStyle(theme.dark),
    [theme.dark],
  );

  const getMessageRenderInfo = useMessageRenderInfo(chatState);

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
    isChatOn,
    messages,
    draftQuestion,
    ...chatState,
    actions: {
      send,
      setDraft: setAiDraftQuestion,
      reset,
      applyScope,
      confirmWrite,
      cancelWrite,
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
