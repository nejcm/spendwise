import type * as PosthogModule from './posthog';

const mockPostHog = jest.fn();
const mockState: { analyticsEnabled?: boolean } = {};

jest.mock('posthog-react-native', () => ({ __esModule: true, default: mockPostHog }));
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

function fakeClient(optedOut = false) {
  return { optedOut, optIn: jest.fn(), optOut: jest.fn(), captureException: jest.fn(), capture: jest.fn() };
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

  it('opts out and drops the client when turned off, and opts back in when turned on', () => {
    const first = fakeClient();
    const second = fakeClient(true);
    mockPostHog.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const { captureError, setAnalyticsEnabled } = load();
    captureError(new Error('a'));

    setAnalyticsEnabled(false);
    captureError(new Error('b'));
    expect(mockState.analyticsEnabled).toBe(false);
    expect(first.optOut).toHaveBeenCalled();
    expect(first.captureException).toHaveBeenCalledTimes(1);
    expect(mockPostHog).toHaveBeenCalledTimes(1);

    setAnalyticsEnabled(true);
    captureError(new Error('c'));
    expect(mockPostHog).toHaveBeenCalledTimes(2);
    expect(second.optIn).toHaveBeenCalled();
    expect(second.captureException).toHaveBeenCalledTimes(1);
  });

  it('does nothing without an API key', () => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = '';
    const { captureError } = load();
    captureError(new Error('boom'));
    expect(mockPostHog).not.toHaveBeenCalled();
  });
});
