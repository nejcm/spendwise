import PostHog from 'posthog-react-native';
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
  if (client || apiKey.length <= 5 || IS_WEB || !isAnalyticsEnabled()) return client;
  try {
    client = new PostHog(apiKey, {
      host,
      personProfiles: 'never',
      disableGeoip: true,
      preloadFeatureFlags: false,
      captureAppLifecycleEvents: false,
    });
    if (client.optedOut) void client.optIn();
  }
  catch (e) {
    console.error('[PostHog] Failed to initialize', e);
  }
  return client;
}

export function setAnalyticsEnabled(analyticsEnabled: boolean) {
  updateAppState({ analyticsEnabled });
  if (analyticsEnabled || !client) return;
  void client.optOut();
  client = undefined;
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
