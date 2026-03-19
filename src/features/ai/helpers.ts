import type { MarkdownStyle } from 'react-native-enriched-markdown';

type MarkdownStyleParams = {
  foreground: string;
  mutedForeground: string;
  subtle: string;
  border: string;
  ring: string;
};
export function getMarkdownStyle({ foreground, mutedForeground, subtle, border, ring }: MarkdownStyleParams): MarkdownStyle {
  return {
    paragraph: { color: String(foreground), fontSize: 16, lineHeight: 22, marginBottom: 6 },
    h1: { color: String(foreground), fontSize: 22, lineHeight: 28, marginBottom: 6 },
    h2: { color: String(foreground), fontSize: 18, lineHeight: 24, marginBottom: 6 },
    h3: { color: String(foreground), fontSize: 16, lineHeight: 22, marginBottom: 6 },
    blockquote: {
      borderColor: String(border),
      borderWidth: 2,
      backgroundColor: String(subtle),
      marginTop: 6,
      marginBottom: 6,
      gapWidth: 10,
    },
    list: { color: String(foreground), bulletColor: String(ring), markerColor: String(mutedForeground) },
    codeBlock: {
      backgroundColor: String(subtle),
      borderColor: String(border),
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      color: String(foreground),
    },
    link: { color: String(foreground), underline: true },
    strong: { color: String(foreground), fontWeight: 'bold' },
    em: { color: String(foreground), fontStyle: 'italic' },
    underline: { color: String(foreground) },
    code: { backgroundColor: String(subtle), borderColor: String(border), color: String(foreground) },
    thematicBreak: { color: String(border), height: 1, marginTop: 8, marginBottom: 8 },
    // Tables/task lists are supported by the "github" flavor, but we keep styling conservative.
    table: { borderColor: String(border), borderRadius: 12, borderWidth: 1, headerBackgroundColor: String(subtle) },
    taskList: {
      checkedColor: String(ring),
      borderColor: String(border),
      checkmarkColor: String(foreground),
      checkedTextColor: String(mutedForeground),
    },
  };
}
