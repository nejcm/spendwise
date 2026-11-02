import type * as PosthogModule from './posthog';

const mockPostHog = jest.fn();
const mockState: { analyticsEnabled?: boolean } = {};

jest.mock('posthog-react-native', () => ({ __esModule: true, default: mockPostHog, PostHogPersistedProperty: { Queue: 'queue' } }));
jest.mock('@/lib/store/store', () => ({
  getAppState: () => mockState,
  updateAppState: (partial: object) => Object.assign(mockState, partial),
}));

type Analytics = typeof PosthogModule;

function load(): Analytics {
  let mod!: Analytics;
  jest.isolateModules(() => {
    mod = require('./posthog');
  });
  return mod;
}

function fakeClient() {
  return {
    optIn: jest.fn(),
    optOut: jest.fn(),
    ready: jest.fn(() => Promise.resolve()),
    setPersistedProperty: jest.fn(),
    captureException: jest.fn(),
    capture: jest.fn(),
  };
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_test_key';
  delete mockState.analyticsEnabled;
  mockPostHog.mockReset();
});

describe('analytics gating', () => {
  it('creates the client lazily with privacy options when the pref is unset (default on)', () => {
    const instance = fakeClient();
    mockPostHog.mockReturnValue(instance);
    const { captureError } = load();
    expect(mockPostHog).not.toHaveBeenCalled();

    captureError(new Error('boom'));

    expect(mockPostHog).toHaveBeenCalledWith('phc_test_key', expect.objectContaining({
      personProfiles: 'never',
      disableGeoip: true,
      preloadFeatureFlags: false,
      captureAppLifecycleEvents: false,
    }));
    expect(instance.captureException).toHaveBeenCalledTimes(1);
  });

  it('never creates a client while the pref is off', () => {
    mockState.analyticsEnabled = false;
    const { captureError, captureEvent } = load();

    captureError(new Error('boom'));
    captureEvent('event');

    expect(mockPostHog).not.toHaveBeenCalled();
  });

  it('opts in on creation even if the SDK has not loaded a persisted opt-out yet', () => {
    const instance = fakeClient();
    mockPostHog.mockReturnValue(instance);
    const { captureEvent } = load();
    captureEvent('event');
    expect(instance.optIn).toHaveBeenCalledTimes(1);
  });

  it('opts out and drops queued events when turned off, then reuses the client when turned on', async () => {
    const instance = fakeClient();
    mockPostHog.mockReturnValue(instance);
    const { captureError, setAnalyticsEnabled } = load();
    captureError(new Error('a'));

    setAnalyticsEnabled(false);
    await Promise.resolve();
    captureError(new Error('b'));
    expect(mockState.analyticsEnabled).toBe(false);
    expect(instance.optOut).toHaveBeenCalledTimes(1);
    expect(instance.setPersistedProperty).toHaveBeenCalledWith('queue', null);
    expect(instance.captureException).toHaveBeenCalledTimes(1);

    setAnalyticsEnabled(true);
    captureError(new Error('c'));
    expect(mockPostHog).toHaveBeenCalledTimes(1);
    expect(instance.optIn).toHaveBeenCalledTimes(2);
    expect(instance.captureException).toHaveBeenCalledTimes(2);
  });

  it('keeps the queue when re-enabled before storage finishes loading', async () => {
    const instance = fakeClient();
    let loaded!: () => void;
    instance.ready.mockReturnValue(new Promise<void>((resolve) => {
      loaded = resolve;
    }));
    mockPostHog.mockReturnValue(instance);
    const { captureEvent, setAnalyticsEnabled } = load();
    captureEvent('event');

    setAnalyticsEnabled(false);
    setAnalyticsEnabled(true);
    loaded();
    await Promise.resolve();
    expect(instance.setPersistedProperty).not.toHaveBeenCalled();
  });

  it('does nothing without an API key', () => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = '';
    const { captureError } = load();
    captureError(new Error('boom'));
    expect(mockPostHog).not.toHaveBeenCalled();
  });
});
