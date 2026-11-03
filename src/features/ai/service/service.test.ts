import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';
import { clearAppStore, setAiFeature, setOpenaiApiKey } from '@/lib/store/store';
import { streamAskOpenAI } from './openai';
import { streamAskWithTools } from './service';
import { executeToolCall, executeWriteToolCall } from './tool-executor';

jest.mock('@/features/accounts/queries', () => ({ getAccounts: jest.fn(async () => []) }));
jest.mock('./openai', () => ({
  ...jest.requireActual<object>('./openai'),
  streamAskOpenAI: jest.fn(),
}));
jest.mock('./tool-executor', () => ({
  executeToolCall: jest.fn(),
  executeWriteToolCall: jest.fn(async () => '{"status":"cancelled"}'),
  isWriteTool: (name: string) => name === 'set_category_budget',
  getToolStatusMessage: () => '',
}));

const streamMock = streamAskOpenAI as jest.MockedFunction<typeof streamAskOpenAI>;
const toolMock = executeToolCall as jest.MockedFunction<typeof executeToolCall>;

const confirmWrite = jest.fn(async () => false);

function ask() {
  return streamAskWithTools({
    messages: [{ id: 'q', role: 'user', content: 'Hi' }],
    db: {} as SQLiteDatabase,
    queryClient: {} as QueryClient,
    confirmWrite,
    scope: { period: { mode: 'this-month' }, accountIds: 'all' },
    onToken: jest.fn(),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  clearAppStore();
  setOpenaiApiKey('sk-test');
  streamMock.mockResolvedValueOnce({ type: 'tool_calls', content: '', calls: [{ id: 'c1', name: 'get_summary', arguments: {} }] });
  streamMock.mockResolvedValue({ type: 'text', content: 'Answer' });
});

describe('streamAskWithTools', () => {
  it('reads the key again for each round of the tool loop', async () => {
    toolMock.mockImplementation(async () => {
      setOpenaiApiKey('sk-new');
      return '{}';
    });

    await expect(ask()).resolves.toBe('Answer');
    expect(streamMock.mock.calls.map(([key]) => key)).toEqual(['sk-test', 'sk-new']);
  });

  it.each([
    ['the key is removed', () => setOpenaiApiKey(undefined)],
    ['Chat is switched off', () => setAiFeature('chat', false)],
  ])('stops before the next provider call when %s mid-loop', async (_: string, turnOff: () => void) => {
    toolMock.mockImplementation(async () => {
      turnOff();
      return '{}';
    });

    await expect(ask()).rejects.toThrow();
    expect(streamMock).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when Chat is off', async () => {
    setAiFeature('chat', false);

    await expect(ask()).rejects.toThrow();
    expect(streamMock).not.toHaveBeenCalled();
  });
});

it('routes write tools through the confirmation path', async () => {
  streamMock.mockReset();
  streamMock.mockResolvedValueOnce({ type: 'tool_calls', content: '', calls: [{ id: 'c1', name: 'set_category_budget', arguments: { category_id: 'c', budget_cents: 100 } }] });
  streamMock.mockResolvedValue({ type: 'text', content: 'Answer' });

  await expect(ask()).resolves.toBe('Answer');
  expect(toolMock).not.toHaveBeenCalled();
  expect(executeWriteToolCall).toHaveBeenCalledWith({ db: {}, queryClient: {}, accountIds: [], confirm: confirmWrite }, 'set_category_budget', { category_id: 'c', budget_cents: 100 });
});
