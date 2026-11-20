import type { ShareIntent } from 'expo-share-intent';
import { useLinkingURL } from 'expo-linking';
import { getScheme, getShareExtensionKey, parseShareIntent, ShareIntentModule } from 'expo-share-intent';
import * as React from 'react';
import { AppState, Platform } from 'react-native';
import { truncateText } from '@/lib/utils';

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

export function toNote(text: string): string {
  return truncateText(text, MAX_NOTE_LENGTH);
}

// The iOS share extension opens `<scheme>://dataUrl=<scheme>ShareKey?nonce=…#<type>`.
export function isShareExtensionUrl(url: string): boolean {
  const prefix = `${getScheme()}://dataUrl=${getShareExtensionKey()}`;
  return url.startsWith(prefix) && /^(?:[?#]|$)/.test(url.slice(prefix.length));
}

export type IncomingShare = { id: number; item: SharedItem };

// Every delivery and receiver error gets its own id, so equal content never reads as the same share.
export function useIncomingShare() {
  const url = useLinkingURL();
  const lastIdRef = React.useRef(0);
  const [share, setShare] = React.useState<IncomingShare | null>(null);
  const [errorId, setErrorId] = React.useState(0);

  React.useEffect(() => {
    if (!ShareIntentModule) return;
    const changeSubscription = ShareIntentModule.addListener('onChange', (event) => {
      const id = ++lastIdRef.current;
      // Read once: iOS re-reads its App Group slot on every foreground; Android already took it.
      ShareIntentModule?.clearShareIntent(getShareExtensionKey());
      let item: SharedItem | null = null;
      try {
        item = getSharedItem(parseShareIntent(event.value, {}));
      }
      catch {}
      if (item) setShare({ id, item });
      else setErrorId(id);
    });
    const errorSubscription = ShareIntentModule.addListener('onError', () => setErrorId(++lastIdRef.current));
    return () => {
      changeSubscription.remove();
      errorSubscription.remove();
    };
  }, []);

  React.useEffect(() => {
    const read = () => {
      if (url && isShareExtensionUrl(url)) void ShareIntentModule?.getShareIntent(url);
      else if (Platform.OS === 'android') void ShareIntentModule?.getShareIntent('');
    };
    read();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') read();
    });
    return () => subscription.remove();
  }, [url]);

  const clearShare = React.useCallback((id: number) => setShare((current) => (current?.id === id ? null : current)), []);
  return { share, errorId, clearShare };
}
