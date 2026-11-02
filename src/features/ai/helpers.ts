import type { MarkdownStyle } from 'react-native-enriched-markdown';
import type { AiScope } from './types';
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

/** Scoped accounts among the active ones; falls back to all when none of the picked ones is still active. */
export function resolveScopeAccounts<T extends { id: string }>(active: readonly T[], picked: AiScope['accountIds']) {
  const selected = picked === 'all' ? [] : active.filter((a) => picked.includes(a.id));
  return selected.length > 0
    ? { accounts: selected, limited: selected.length < active.length }
    : { accounts: active, limited: false };
}

export function isSameAccountScope(active: readonly { id: string }[], a: AiScope['accountIds'], b: AiScope['accountIds']) {
  const key = (picked: AiScope['accountIds']) => {
    const { accounts, limited } = resolveScopeAccounts(active, picked);
    return limited ? accounts.map((x) => x.id).sort().join() : 'all';
  };
  return key(a) === key(b);
}

export function toggleScopeAccount(picked: AiScope['accountIds'], id: string): AiScope['accountIds'] {
  const current = picked === 'all' ? [] : picked;
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  return next.length > 0 ? next : 'all';
}

/** "sk-proj-abc…4f2a" → "sk-••••••••4f2a"; short keys show only bullets. */
export function maskApiKey(key: string) {
  const trimmed = key.trim();
  if (trimmed.length < 12) return '••••••••';
  const prefix = trimmed.startsWith('sk-') ? 'sk-' : '';
  return `${prefix}••••••••${trimmed.slice(-4)}`;
}
