import type { LinkPressEvent, MarkdownStyle } from 'react-native-enriched-markdown';
import * as React from 'react';
import { Linking } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

export type AssistantMessageProps = {
  content: string;
  streaming?: boolean;
  markdownStyle?: MarkdownStyle;
};

function openLink({ url }: LinkPressEvent) {
  Linking.openURL(url);
}

export default function AssistantMessage({ content, streaming, markdownStyle }: AssistantMessageProps) {
  return (
    <EnrichedMarkdownText
      markdown={content}
      markdownStyle={markdownStyle}
      flavor="github"
      streamingAnimation={streaming}
      onLinkPress={openLink}
    />
  );
}
