import type { MarkdownStyle } from 'react-native-enriched-markdown';
import * as React from 'react';
import { Linking } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

export type AssistantMessageProps = {
  content: string;
  streaming?: boolean;
  markdownStyle?: MarkdownStyle;
};

export default function AssistantMessage({ content, streaming, markdownStyle }: AssistantMessageProps) {
  return (
    <EnrichedMarkdownText
      markdown={content}
      markdownStyle={markdownStyle}
      flavor="github"
      streamingAnimation={streaming}
      onLinkPress={({ url }) => Linking.openURL(url)}
    />
  );
}
