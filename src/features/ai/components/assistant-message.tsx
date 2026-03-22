import type { MarkdownStyle } from 'react-native-enriched-markdown';
import { Linking } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

export type MessageProps = {
  content: string;
  streaming?: boolean;
  markdownStyle?: MarkdownStyle;
};

export function AssistantMessage({ content, streaming = false, markdownStyle }: MessageProps) {
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
