import type { MarkdownStyle } from 'react-native-enriched-markdown';
import { Link } from 'expo-router';
import { SendHorizonal } from 'lucide-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Linking, Platform } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import { useCSSVariable } from 'uniwind';
import { FocusAwareStatusBar, Input, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { useChat } from '@/lib/ai/use-chat';
import { translate } from '@/lib/i18n';
import { selectAiEnabled, useAppStore } from '@/lib/store';
import { IconButton } from '../../components/ui/icon-button';
import { getMarkdownStyle } from './helpers';

const PRESET_QUESTIONS = [
  translate('ai.preset_overview'),
  translate('ai.preset_groceries'),
  translate('ai.preset_overspending'),
  translate('ai.preset_monthly_budget'),
  translate('ai.preset_subscriptions'),
];

export function AiScreen() {
  const aiEnabled = useAppStore(selectAiEnabled);

  const foreground = useCSSVariable('--color-foreground');
  const mutedForeground = useCSSVariable('--color-muted-foreground');
  const subtle = useCSSVariable('--color-subtle');
  const border = useCSSVariable('--color-border');
  const ring = useCSSVariable('--color-ring');
  const markdownStyle = React.useMemo<MarkdownStyle>(
    () => getMarkdownStyle({
      foreground: String(foreground),
      mutedForeground: String(mutedForeground),
      subtle: String(subtle),
      border: String(border),
      ring: String(ring),
    }),
    [border, foreground, mutedForeground, ring, subtle],
  );

  const [input, setInput] = React.useState('');
  const { messages, error, sendMessage } = useChat({
    onError: (err) => console.error(err, 'ERROR'),
  });

  if (error) return <Text>{error.message}</Text>;
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FocusAwareStatusBar />
      <View
        className="h-[95%] flex-1 flex-col py-2"
      >
        <ScrollView className="flex-1 px-4 pt-4">
          {(!aiEnabled)
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
                    <View className="my-4">
                      <Text className="mb-2 text-center">
                        {translate('ai.ask_prompt')}
                      </Text>
                      <View className="mt-3 flex flex-col space-y-2">
                        {PRESET_QUESTIONS.map((q) => (
                          <SolidButton
                            key={q}
                            color="secondary"
                            size="sm"
                            label={q}
                            className="h-auto rounded-3xl px-4 py-2"
                            textClassName="text-left text-muted-foreground leading-tight"
                            onPress={() => {
                              void sendMessage({ text: q });
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  )
                : null}
          {messages.map((m) => (
            <View key={m.id} style={{ marginVertical: 8 }}>
              <View>
                <Text style={{ fontWeight: 700 }}>{m.role}</Text>
                {m.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <EnrichedMarkdownText
                          key={`${m.id}-${i}`}
                          markdown={part.text}
                          flavor="github"
                          onLinkPress={({ url }) => {
                            if (url) void Linking.openURL(url);
                          }}
                          markdownStyle={markdownStyle}
                          containerStyle={{ flexShrink: 1 }}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </View>
            </View>
          ))}
        </ScrollView>
        <View className="relative mx-4 mt-2">
          <Input
            variant="textarea"
            value={input}
            onChange={(e) => setInput(e.nativeEvent.text)}
            onSubmitEditing={(e) => {
              e.preventDefault();
              void sendMessage({ text: input });
              setInput('');
            }}
            placeholder={translate('ai.input_placeholder')}
            autoCapitalize="sentences"
            autoCorrect
            multiline
            disabled={!aiEnabled}
            className="min-h-[80] py-2 pr-12"
            autoFocus={true}
          />
          <IconButton
            size="sm"
            onPress={() => {
              void sendMessage({ text: input });
              setInput('');
            }}
            disabled={!aiEnabled || !input.trim()}
            className="absolute right-2 bottom-2 rounded-full"
          >
            <SendHorizonal className="size-5 text-background disabled:text-foreground" />
          </IconButton>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
