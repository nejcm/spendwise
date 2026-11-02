import type { MarkdownStyle } from 'react-native-enriched-markdown';
import { DarkTheme, LightTheme } from '@/lib/theme/styles';

export function getMarkdownStyle(isDark: boolean): MarkdownStyle {
  const colors = isDark ? DarkTheme.colors : LightTheme.colors;
  const mutedForeground = isDark ? '#9a9ca1' : '#6f6b7a';
  const muted = isDark ? '#2a2b30' : '#f1eff7';
  return {
    paragraph: { fontFamily: 'Outfit', fontSize: 14, color: colors.text, marginTop: 0, marginBottom: 4, lineHeight: Math.round(14 * 1.33) },
    h1: { fontFamily: 'Outfit', fontSize: 19, fontWeight: 'bold', color: colors.text, marginBottom: 6, lineHeight: Math.round(19 * 1.33) },
    h2: { fontFamily: 'Outfit', fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4, lineHeight: Math.round(18 * 1.33) },
    h3: { fontFamily: 'Outfit', fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4, lineHeight: Math.round(16 * 1.33) },
    h4: { fontFamily: 'Outfit', fontSize: 15, fontWeight: 'bold', color: colors.text, lineHeight: Math.round(15 * 1.33) },
    h5: { fontFamily: 'Outfit', fontSize: 14, fontWeight: 'bold', color: colors.text, lineHeight: Math.round(14 * 1.33) },
    h6: { fontFamily: 'Outfit', fontSize: 14, fontWeight: 'bold', color: colors.text, lineHeight: Math.round(14 * 1.33) },
    strong: { fontFamily: 'Outfit', fontWeight: 'bold' },
    em: { fontStyle: 'italic' },
    blockquote: {
      fontFamily: 'Outfit',
      fontSize: 14,
      lineHeight: Math.round(14 * 1.33),
      color: mutedForeground,
      borderColor: mutedForeground,
      borderWidth: 2,
      gapWidth: 8,
      backgroundColor: colors.border,
    },
    list: {
      fontFamily: 'Outfit',
      fontSize: 14,
      color: colors.text,
      bulletColor: mutedForeground,
      bulletSize: 5,
      gapWidth: 8,
      marginLeft: 20,
      lineHeight: Math.round(14 * 1.33),
    },
    codeBlock: {
      fontFamily: 'Outfit',
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
    link: { color: '#2668ab', underline: true },
    thematicBreak: { color: colors.border },
  } as const;
}
