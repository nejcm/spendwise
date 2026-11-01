import PostHog, { PostHogPersistedProperty } from 'posthog-react-native';
import { IS_WEB } from '@/lib/base';
import { getAppState, updateAppState } from '@/lib/store/store';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let client: PostHog | undefined;

function isAnalyticsEnabled() {
  return getAppState().analyticsEnabled ?? true;
}

/** Created on first use, and only while the user's "Share anonymous usage stats" pref is on. */
function getClient(): PostHog | undefined {
  if (!isAnalyticsEnabled()) return undefined;
  if (client || apiKey.length <= 5 || IS_WEB) return client;
  try {
    client = new PostHog(apiKey, {
      host,
      personProfiles: 'never',
      disableGeoip: true,
      preloadFeatureFlags: false,
      captureAppLifecycleEvents: false,
    });
    // optedOut reads false until storage loads, so an earlier persisted opt-out must be cleared unconditionally.
    void client.optIn();
  }
  catch (e) {
    console.error('[PostHog] Failed to initialize', e);
  }
  return client;
}

export function setAnalyticsEnabled(analyticsEnabled: boolean) {
  updateAppState({ analyticsEnabled });
  const current = client;
  if (!current) return;
  if (analyticsEnabled) {
    void current.optIn();
    return;
  }
  void current.optOut();
  // The SDK flushes queued events despite opt-out (timer, AppState), so drop them once storage has loaded.
  void current.ready().then(() => {
    if (!isAnalyticsEnabled()) current.setPersistedProperty(PostHogPersistedProperty.Queue, null);
  });
}

export function captureError(
  error: Error,
  context?: Parameters<PostHog['captureException']>[1],
) {
  getClient()?.captureException(error, context);
}

export function captureEvent(...args: Parameters<PostHog['capture']>) {
  getClient()?.capture(...args);
}
