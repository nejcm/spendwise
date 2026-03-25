import PostHog from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

/**
 * Singleton PostHog client.
 * Disabled when no API key is configured or in development (opt-in via env var).
 * Pass this instance to <PostHogProvider client={posthogClient}> to avoid
 * creating a second client inside the provider.
 */
export const posthogClient = new PostHog(apiKey, {
  host,
  disabled: !apiKey,
});

export function captureError(error: Error, context?: Record<string, unknown>) {
  posthogClient.capture('$exception', {
    $exception_message: error.message,
    $exception_type: error.name,
    $exception_stack: error.stack ?? '',
    ...context,
  });
}

export function captureEvent(...args: Parameters<typeof posthogClient['capture']>) {
  posthogClient.capture(...args);
}
