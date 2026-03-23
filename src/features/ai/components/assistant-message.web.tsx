import type { MarkdownStyle } from 'react-native-enriched-markdown';
import * as React from 'react';
import { Text } from '@/components/ui';

export type AssistantMessageProps = {
  content: string;
  streaming?: boolean;
  markdownStyle?: MarkdownStyle;
};

export default function AssistantMessage({ content }: AssistantMessageProps) {
  return (
    <Text className="text-sm text-foreground">
      {content}
    </Text>
  );
}
