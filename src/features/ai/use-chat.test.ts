import type { ChatMessage } from './types';
import { showSnackbar } from '@/components/ui/snackbar';
import { clearAppStore, setAiFeature, setOpenaiApiKey } from '@/lib/store/store';
import { act, renderHook } from '@/lib/test-utils';
import { streamAskWithTools } from './service';
import { clearAiChat, DEFAULT_AI_SCOPE, getAiScope, setAiMessages, useAiChatStore } from './store';
import { useChat } from './use-chat';

let mockId = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `id-${++mockId}` }));
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('@/lib/theme/use-theme-config', () => ({ useThemeConfig: () => ({ dark: false }) }));
jest.mock('@/lib/analytics', () => ({ captureError: jest.fn() }));
jest.mock('./service', () => ({ streamAskWithTools: jest.fn() }));
jest.mock('@/components/ui/snackbar', () => ({ showSnackbar: jest.fn(), hideSnackbar: jest.fn() }));

const streamMock = streamAskWithTools as jest.MockedFunction<typeof streamAskWithTools>;
const snackbarMock = showSnackbar as jest.MockedFunction<typeof showSnackbar>;

const oldChat: ChatMessage[] = [
  { id: 'q1', role: 'user', content: 'Old question' },
  { id: 'a1', role: 'assistant', content: 'Old answer' },
];

function deferred() {
  let resolve!: (value: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const contents = () => useAiChatStore.getState().messages.map((m) => m.content);
const lastUndo = () => snackbarMock.mock.calls.at(-1)![0].undo!;

function abortableStream() {
  streamMock.mockImplementation(({ signal }) => new Promise((_, reject) => {
    signal?.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  return () => streamMock.mock.calls.at(-1)![0].signal!;
}

beforeEach(() => {
  jest.clearAllMocks();
  clearAppStore();
  setOpenaiApiKey('sk-test');
  clearAiChat();
  useAiChatStore.setState({ scope: undefined });
  setAiMessages(oldChat);
});

describe('useChat', () => {
  it('keeps an Undo restore when the new request completes', async () => {
    const response = deferred();
    streamMock.mockReturnValue(response.promise);
    const { result } = renderHook(() => useChat());

    act(() => result.current.actions.reset());
    act(() => result.current.actions.send('New question'));
    act(() => void lastUndo()());
    await act(async () => response.resolve('New answer'));

    expect(contents()).toEqual(['Old question', 'Old answer', 'New question', 'New answer']);
  });

  it('keeps an Undo restore when the new request fails', async () => {
    const response = deferred();
    streamMock.mockReturnValue(response.promise);
    const { result } = renderHook(() => useChat());

    act(() => result.current.actions.reset());
    act(() => result.current.actions.send('New question'));
    act(() => void lastUndo()());
    await act(async () => response.reject(new Error('boom')));

    expect(contents()).toEqual(['Old question', 'Old answer', 'New question']);
  });

  it('starts a new chat without Undo when the account scope changes', () => {
    const { result } = renderHook(() => useChat());
    act(() => result.current.actions.reset());
    const undo = lastUndo();
    act(() => setAiMessages([{ id: 'q2', role: 'user', content: 'Since' }]));

    const scope = { ...DEFAULT_AI_SCOPE, accountIds: ['acc_1'] };
    act(() => result.current.actions.applyScope(scope, true));
    act(() => void undo());

    expect(getAiScope()).toEqual(scope);
    expect(contents()).toEqual([]);
    expect(snackbarMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the chat when only the period changes', () => {
    const { result } = renderHook(() => useChat());
    const scope = { ...DEFAULT_AI_SCOPE, period: { mode: 'this-year' as const } };

    act(() => result.current.actions.applyScope(scope, false));

    expect(getAiScope()).toEqual(scope);
    expect(contents()).toEqual(['Old question', 'Old answer']);
  });

  it('does not send while Chat is switched off', () => {
    act(() => setAiFeature('chat', false));
    const { result } = renderHook(() => useChat());

    act(() => result.current.actions.send('New question'));

    expect(result.current.isChatOn).toBe(false);
    expect(streamMock).not.toHaveBeenCalled();
    expect(contents()).toEqual(['Old question', 'Old answer']);
  });

  it.each([
    ['Chat is switched off', () => setAiFeature('chat', false)],
    ['the key is removed', () => setOpenaiApiKey(undefined)],
  ])('aborts a streaming answer when %s and drops its placeholder', async (_: string, turnOff: () => void) => {
    const signal = abortableStream();
    const { result } = renderHook(() => useChat());
    act(() => result.current.actions.send('New question'));

    await act(async () => turnOff());

    expect(signal().aborted).toBe(true);
    expect(result.current.isStreaming).toBe(false);
    expect(contents()).toEqual(['Old question', 'Old answer', 'New question']);
  });
});
