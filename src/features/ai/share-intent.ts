import type { ShareIntent } from 'expo-share-intent';
import { getScheme, getShareExtensionKey } from 'expo-share-intent';

// Matches the transaction form's note limit.
const MAX_NOTE_LENGTH = 500;

export type ShareAction
  = | { kind: 'scan-image'; uri: string; width: number | null; height: number | null }
    | { kind: 'scan-text'; text: string }
    | { kind: 'open-form'; note?: string };

export function resolveShareAction(shareIntent: ShareIntent, isScanOn: boolean): ShareAction | null {
  const image = shareIntent.files?.find((file) => file.mimeType?.startsWith('image/'));
  if (image) {
    return isScanOn
      ? { kind: 'scan-image', uri: image.path, width: image.width, height: image.height }
      : { kind: 'open-form' };
  }
  const text = shareIntent.text?.trim();
  if (text) {
    return isScanOn ? { kind: 'scan-text', text } : { kind: 'open-form', note: text.slice(0, MAX_NOTE_LENGTH) };
  }
  return null;
}

export function shareIntentKey(shareIntent: ShareIntent): string {
  return shareIntent.text ?? shareIntent.files?.map((file) => file.path).join('\n') ?? '';
}

// The iOS share extension opens `<scheme>://dataUrl=<scheme>ShareKey?nonce=…#<type>`.
export function isShareExtensionUrl(url: string): boolean {
  const prefix = `${getScheme()}://dataUrl=${getShareExtensionKey()}`;
  return url.startsWith(prefix) && /^(?:[?#]|$)/.test(url.slice(prefix.length));
}
