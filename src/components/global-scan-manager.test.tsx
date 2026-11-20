import type { IncomingShare } from '@/features/ai/use-incoming-share';
import { act, render } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { Alert } from '@/components/ui';
import { clearAppStore, setIsFirstTime, setIsLocked, setLockEnabled, setOpenaiApiKey } from '@/lib/store/store';
import { GlobalScanManager } from './global-scan-manager';

jest.mock('@/features/ai/use-incoming-share', () => {
  const { useSyncExternalStore } = require('react');
  return {
    useIncomingShare: () => [useSyncExternalStore(mockShareStore.subscribe, () => mockShareStore.incoming), mockClearShare],
  };
});
jest.mock('expo-router', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));
jest.mock('@/components/ui', () => ({ Alert: { alert: jest.fn() }, ActivityIndicator: () => null, Modal: () => null, Text: () => null }));
jest.mock('@/features/accounts/api', () => ({ useAccounts: () => ({ data: [] }) }));
jest.mock('@/features/categories/api', () => ({ useCategories: () => ({ data: [] }) }));
jest.mock('@/features/transactions/api', () => ({ useCreateTransaction: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('@/features/ai/use-scan-receipt', () => ({
  useScanReceipt: () => ({ mutate: mockScan, isPending: mockScanState.pending, reset: jest.fn() }),
}));
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: jest.fn(), isPending: false }) }));

const mockPush = jest.fn();
const mockScan = jest.fn();
const mockScanState = { pending: false };
const mockShareStore = {
  incoming: null as IncomingShare | null,
  listeners: new Set<() => void>(),
  subscribe: (listener: () => void) => {
    mockShareStore.listeners.add(listener);
    return () => mockShareStore.listeners.delete(listener);
  },
};
const mockClearShare = jest.fn(() => deliver(null));
let appStateListener: ((state: string) => void) | undefined;
const originalAppState = AppState.currentState;

function setCurrentAppState(state: string) {
  Object.defineProperty(AppState, 'currentState', { value: state, configurable: true, writable: true });
}

function deliver(incoming: IncomingShare | null) {
  mockShareStore.incoming = incoming;
  mockShareStore.listeners.forEach((listener) => listener());
}

function share(text: string, replacedEarlier = false) {
  act(() => deliver({ shareIntent: { files: null, text, webUrl: null, type: 'text' }, replacedEarlier }));
}

beforeEach(() => {
  clearAppStore();
  setIsFirstTime(false);
  setOpenaiApiKey('sk-test');
  mockShareStore.incoming = null;
  mockScanState.pending = false;
  jest.clearAllMocks();
  setCurrentAppState('active');
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener as (state: string) => void;
    return { remove: jest.fn() };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(AppState, 'currentState', { value: originalAppState, configurable: true, writable: true });
});

describe('share handling', () => {
  it('scans shared text once and clears the share', () => {
    const { rerender } = render(<GlobalScanManager />);
    share('Paid €12.50 at Lidl');
    rerender(<GlobalScanManager />);

    expect(mockScan).toHaveBeenCalledTimes(1);
    expect(mockScan).toHaveBeenCalledWith({ text: 'Paid €12.50 at Lidl' });
    expect(mockClearShare).toHaveBeenCalledTimes(1);
  });

  it('waits for unlock before processing a share', () => {
    setLockEnabled(true);
    setIsLocked(true);
    render(<GlobalScanManager />);
    share('Paid €12.50');

    expect(mockScan).not.toHaveBeenCalled();
    expect(mockClearShare).not.toHaveBeenCalled();

    act(() => setIsLocked(false));

    expect(mockScan).toHaveBeenCalledTimes(1);
  });

  it('holds a warm share delivered before resume until the lock check on active has run', () => {
    setCurrentAppState('background');
    setLockEnabled(true);
    render(<GlobalScanManager />);
    share('Paid €12.50');

    expect(mockScan).not.toHaveBeenCalled();

    act(() => {
      appStateListener?.('active');
      setIsLocked(true);
    });

    expect(mockScan).not.toHaveBeenCalled();

    act(() => setIsLocked(false));

    expect(mockScan).toHaveBeenCalledTimes(1);
  });

  it('waits for a running scan to finish before starting the next one', () => {
    mockScanState.pending = true;
    const { rerender } = render(<GlobalScanManager />);
    share('Paid €12.50');

    expect(mockScan).not.toHaveBeenCalled();

    mockScanState.pending = false;
    rerender(<GlobalScanManager />);

    expect(mockScan).toHaveBeenCalledTimes(1);
  });

  it('waits for onboarding to finish', () => {
    setIsFirstTime(true);
    render(<GlobalScanManager />);
    share('Paid €12.50');

    expect(mockScan).not.toHaveBeenCalled();
  });

  it('opens the form with the text as a note and sends nothing without a key', () => {
    setOpenaiApiKey(undefined);
    render(<GlobalScanManager />);
    share('Paid €12.50');

    expect(mockScan).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/transactions/new', params: { note: 'Paid €12.50' } });
    expect(Alert.alert).toHaveBeenCalledWith('AI key not set up', expect.any(String), expect.any(Array));
  });

  it('scans the latest share and says an earlier one was replaced', () => {
    render(<GlobalScanManager />);
    share('Second', true);

    expect(mockScan).toHaveBeenCalledWith({ text: 'Second' });
    expect(Alert.alert).toHaveBeenCalledWith('Only the last item you shared was imported. Share the earlier one again to add it.');
  });

  it('shows a receiver error and clears it', () => {
    render(<GlobalScanManager />);
    act(() => deliver({ error: 'Cannot retreive appGroupIdentifier' }));

    expect(mockScan).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not read the shared item. Please try sharing it again.');
    expect(mockClearShare).toHaveBeenCalledTimes(1);
  });
});
