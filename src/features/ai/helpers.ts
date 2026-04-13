import type { Theme } from '@react-navigation/native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import { DarkTheme, LightTheme } from '@/lib/theme/styles';

export function getMarkdownStyle(isDark: Theme['dark']): MarkdownStyle {
  const colors = isDark ? DarkTheme.colors : LightTheme.colors;
  const mutedForeground = isDark ? '#6b7280' : '#9ca3af';
  const muted = isDark ? '#393c49' : '#e9eaec';
  return {
    paragraph: { fontFamily: 'Inter', fontSize: 14, color: colors.text, marginTop: 0, marginBottom: 4, lineHeight: 1.33 },
    h1: { fontFamily: 'Inter-Bold', fontSize: 19, color: colors.text, marginBottom: 6, lineHeight: 1.33 },
    h2: { fontFamily: 'Inter-Bold', fontSize: 18, color: colors.text, marginBottom: 4, lineHeight: 1.33 },
    h3: { fontFamily: 'Inter-Bold', fontSize: 16, color: colors.text, marginBottom: 4, lineHeight: 1.33 },
    h4: { fontFamily: 'Inter-Bold', fontSize: 15, color: colors.text, lineHeight: 1.33 },
    h5: { fontFamily: 'Inter-Bold', fontSize: 14, color: colors.text, lineHeight: 1.33 },
    h6: { fontFamily: 'Inter-Bold', fontSize: 14, color: colors.text, lineHeight: 1.33 },
    strong: { fontFamily: 'Inter-Bold' },
    em: { fontStyle: 'italic' },
    blockquote: {
      fontFamily: 'Inter',
      fontSize: 14,
      lineHeight: 1.33,
      color: mutedForeground,
      borderColor: mutedForeground,
      borderWidth: 2,
      gapWidth: 8,
      backgroundColor: colors.border,
    },
    list: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: colors.text,
      bulletColor: mutedForeground,
      bulletSize: 5,
      marginLeft: 16,
      gapWidth: 4,
      lineHeight: 1.33,
    },
    codeBlock: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: colors.text,
      backgroundColor: muted,
      borderWidth: 0,
      borderRadius: 6,
      padding: 8,
    },
    code: {
      fontSize: 13,
      color: colors.text,
      backgroundColor: muted,
    },
    link: { color: colors.primary, underline: true },
    thematicBreak: { color: colors.border },
  } as const;
}
