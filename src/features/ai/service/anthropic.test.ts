import { fetch as expoFetch } from 'expo/fetch';
import { errorResponse, sseResponse } from '@/test-utils/sse-response';
import { streamAskAnthropic } from './anthropic';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const fetchMock = jest.mocked(expoFetch);
const INPUT = { apiKey: 'sk-ant-test', systemPrompt: 'You are a finance assistant.', messages: [{ role: 'user' as const, content: 'How much on food?' }] };

describe('streamAskAnthropic', () => {
  it('assembles streamed text and a tool call split across chunks', async () => {
    fetchMock.mockResolvedValue(sseResponse([
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Food cost ' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '€42.' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'toolu_1', name: 'get_summary' } },
      { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"start_date": "2026-11-01",' } },
      { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: ' "end_date": "2026-12-01"}' } },
      { type: 'content_block_stop', index: 1 },
      { type: 'message_stop' },
    ]) as any);
    const tokens: string[] = [];

    const response = await streamAskAnthropic({ ...INPUT, onToken: (token) => tokens.push(token) });

    expect(response).toEqual({
      type: 'tool_calls',
      content: 'Food cost €42.',
      calls: [{ id: 'toolu_1', name: 'get_summary', arguments: { start_date: '2026-11-01', end_date: '2026-12-01' } }],
    });
    expect(tokens).toEqual(['Food cost ', '€42.']);
  });

  it('surfaces the provider error message', async () => {
    fetchMock.mockResolvedValue(errorResponse(401, '{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}') as any);

    await expect(streamAskAnthropic({ ...INPUT, onToken: jest.fn() })).rejects.toThrow('Anthropic error: invalid x-api-key');
  });
});
