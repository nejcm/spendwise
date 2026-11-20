import type { ShareIntent } from 'expo-share-intent';
import { getScheme, getShareExtensionKey } from 'expo-share-intent';

// Matches the transaction form's note limit.
const MAX_NOTE_LENGTH = 500;

export type SharedItem
  = | { kind: 'image'; uri: string; width: number | null; height: number | null }
    | { kind: 'text'; text: string };

export function getSharedItem(shareIntent: ShareIntent): SharedItem | null {
  const image = shareIntent.files?.find((file) => file.mimeType?.startsWith('image/'));
  if (image) return { kind: 'image', uri: image.path, width: image.width, height: image.height };
  const text = shareIntent.text?.trim();
  return text ? { kind: 'text', text } : null;
}

// A lone surrogate makes Expo Router's encodeURIComponent throw.
export function toNote(text: string): string {
  const cut = text.slice(0, MAX_NOTE_LENGTH);
  return /[\uD800-\uDBFF]$/.test(cut) ? cut.slice(0, -1) : cut;
}

// The iOS share extension opens `<scheme>://dataUrl=<scheme>ShareKey?nonce=…#<type>`.
export function isShareExtensionUrl(url: string): boolean {
  const prefix = `${getScheme()}://dataUrl=${getShareExtensionKey()}`;
  return url.startsWith(prefix) && /^(?:[?#]|$)/.test(url.slice(prefix.length));
}
