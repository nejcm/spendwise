import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { ChatMessage } from '@/features/ai/service';
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

export function useChat() {
  const db = useSQLiteContext();
  const theme = useThemeConfig();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();
  const messages = useAiChatStore.use.messages();
  const question = useAiChatStore.use.draftQuestion();
  const hasKey = Boolean(openaiApiKey) || Boolean(anthropicApiKey);
  const inFlightRequestRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isMountedRef = React.useRef(true);

  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingAssistantId, setStreamingAssistantId] = React.useState<string | null>(null);
  const [streamedAssistantContent, setStreamedAssistantContent] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleNewChat = React.useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    inFlightRequestRef.current = false;
    setIsStreaming(false);
    setStreamingAssistantId(null);
    setStreamedAssistantContent('');
    setErrorMessage(null);
    clearAiChat();
  }, []);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSend = React.useCallback((presetQuestion?: string) => {
    const sourceQuestion = presetQuestion ?? question;
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
  }, [db, isStreaming, question]);

  const markdownStyle = React.useMemo<MarkdownStyle>(
    () => getMarkdownStyle(theme.dark),
    [theme.dark],
  );

  return {
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
  };
}
