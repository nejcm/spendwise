import type { ShareIntent } from 'expo-share-intent';
import { getShareExtensionKey, parseShareIntent, ShareIntentModule } from 'expo-share-intent';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { isShareExtensionUrl } from './share-intent';

export type IncomingShare
  = | { shareIntent: ShareIntent; replacedEarlier: boolean }
    | { error: string };

// The native iOS reader force-unwraps the fragment, so only links the extension builds may reach it.
const SHARE_URL_FRAGMENT = /#(?:text|media|file|weburl)$/;

export function useIncomingShare(): [IncomingShare | null, () => void] {
  const [incoming, setIncoming] = useState<IncomingShare | null>(null);

  useEffect(() => {
    const module = ShareIntentModule;
    if (!module) return;
    const changeSubscription = module.addListener('onChange', ({ value }) => {
      void module.clearShareIntent(getShareExtensionKey());
      const shareIntent = parseShareIntent(value, {});
      setIncoming((previous) => ({ shareIntent, replacedEarlier: previous !== null && 'shareIntent' in previous }));
    });
    const errorSubscription = module.addListener('onError', ({ value }) => {
      setIncoming((previous) => previous ?? { error: value });
    });
    // Each extension link carries a nonce, so reading a link once means reading each share once.
    let lastReadUrl: string | null = null;
    const read = (url: string | null) => {
      if (!url || url === lastReadUrl || !isShareExtensionUrl(url) || !SHARE_URL_FRAGMENT.test(url)) return;
      lastReadUrl = url;
      module.getShareIntent(url);
    };
    if (Platform.OS === 'android') module.getShareIntent('');
    else void Linking.getInitialURL().then(read);
    const urlSubscription = Linking.addEventListener('url', ({ url }) => read(url));
    return () => {
      changeSubscription.remove();
      errorSubscription.remove();
      urlSubscription.remove();
    };
  }, []);

  const clear = useCallback(() => setIncoming(null), []);
  return [incoming, clear];
}
