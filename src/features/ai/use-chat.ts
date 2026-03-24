import type { LayoutChangeEvent, ScrollView as RNScrollView } from 'react-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { ChatMessage, UseChatReturn } from '@/features/ai/types';
import { useSQLiteContext } from 'expo-sqlite';

import * as React from 'react';
import { buildAiPromptContext } from '@/features/ai/context';
import { streamAsk } from '@/features/ai/service';
import { clearAiChat, setAiDraftQuestion, setAiMessages, useAiChatStore } from '@/features/ai/store';
import { translate } from '@/lib/i18n';
import { generateId } from '@/lib/sqlite';
import { useAppStore } from '@/lib/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { getMarkdownStyle } from './helpers';

const TOP_OFFSET = 8;
const FALLBACK_FILLER_RATIO = 0.7;

export function useChat(): UseChatReturn {
  const db = useSQLiteContext();
  const theme = useThemeConfig();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();
  const messages = useAiChatStore.use.messages();
  const draftQuestion = useAiChatStore.use.draftQuestion();
  const hasKey = Boolean(openaiApiKey) || Boolean(anthropicApiKey);
  const inFlightRequestRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isMountedRef = React.useRef(true);

  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingAssistantId, setStreamingAssistantId] = React.useState<string | null>(null);
  const [streamedAssistantContent, setStreamedAssistantContent] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [lastSubmittedUserMessageId, setLastSubmittedUserMessageId] = React.useState<string | null>(null);
  const scrollViewRef = React.useRef<RNScrollView>(null);
  const messageLayoutsRef = React.useRef<Record<string, { y: number; height: number }>>({});
  const pendingScrollUserMessageIdRef = React.useRef<string | null>(null);
  const [viewportHeight, setViewportHeight] = React.useState(0);

  const reset = React.useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    inFlightRequestRef.current = false;
    setIsStreaming(false);
    setStreamingAssistantId(null);
    setStreamedAssistantContent('');
    setErrorMessage(null);
    setLastSubmittedUserMessageId(null);
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
    if (!trimmed || isStreaming || inFlightRequestRef.current) return;

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
    setErrorMessage(null);

    setAiMessages(currentMessages);
    setAiDraftQuestion('');
    setLastSubmittedUserMessageId(userMessage.id);

    setStreamingAssistantId(assistantPlaceholder.id);
    setStreamedAssistantContent('');
    setIsStreaming(true);

    void (async () => {
      try {
        const context = await buildAiPromptContext(db, userMessage.content);
        const finalContent = await streamAsk({
          messages: [...existingMessages, userMessage],
          context,
          onToken: (token) => {
            if (!isMountedRef.current) return;
            setStreamedAssistantContent((prev) => prev + token);
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

        const message = err instanceof Error
          ? err.message
          : translate('ai.contact_error');
        setErrorMessage(message);

        // Remove the placeholder assistant message; keep the user's question.
        setAiMessages([...existingMessages, userMessage]);
      }
      finally {
        // If a newer request replaced the active AbortController, don't clobber its UI state.
        if (abortControllerRef.current === controller) {
          inFlightRequestRef.current = false;
          abortControllerRef.current = null;

          if (isMountedRef.current) {
            setIsStreaming(false);
            setStreamingAssistantId(null);
            setStreamedAssistantContent('');
          }
        }
      }
    })();
  }, [db, isStreaming, draftQuestion]);

  const markdownStyle = React.useMemo<MarkdownStyle>(
    () => getMarkdownStyle(theme.dark),
    [theme.dark],
  );

  // --- Streaming content resolution ---

  const getMessageRenderInfo = React.useCallback(
    (message: ChatMessage) => ({
      displayContent: message.id === streamingAssistantId
        ? streamedAssistantContent
        : message.content,
      isLiveStreaming: isStreaming && message.id === streamingAssistantId,
    }),
    [streamingAssistantId, streamedAssistantContent, isStreaming],
  );

  // --- Scroll management ---

  const lastMessage = messages.at(-1);
  const lastAssistant = lastMessage?.role === 'assistant' ? lastMessage : null;
  const shouldShowBottomFiller
    = lastMessage?.role === 'user'
      || (Boolean(lastAssistant) && isStreaming && lastAssistant?.id === streamingAssistantId);
  const fillerAnchorMessageId = shouldShowBottomFiller ? lastMessage?.id : null;
  const measuredAnchorHeight = fillerAnchorMessageId
    ? messageLayoutsRef.current[fillerAnchorMessageId]?.height
    : undefined;
  const fallbackBottomFillerHeight = viewportHeight > 0 ? viewportHeight * FALLBACK_FILLER_RATIO : 0;
  const bottomFillerHeight = shouldShowBottomFiller
    ? Math.max(0, measuredAnchorHeight !== undefined
        ? viewportHeight - measuredAnchorHeight - TOP_OFFSET
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
    if (!lastSubmittedUserMessageId) return;
    pendingScrollUserMessageIdRef.current = lastSubmittedUserMessageId;
    scrollUserMessageToTop(lastSubmittedUserMessageId);
  }, [lastSubmittedUserMessageId, scrollUserMessageToTop]);

  const onScrollViewLayout = React.useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
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
    hasKey,
    messages,
    draftQuestion,
    isStreaming,
    errorMessage,
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
