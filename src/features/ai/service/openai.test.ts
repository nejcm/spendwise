import { fetch as expoFetch } from 'expo/fetch';
import { sseResponse } from '@/test-utils/sse-response';
import { streamAskOpenAI } from './openai';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const fetchMock = jest.mocked(expoFetch);
const MESSAGES = [{ role: 'user' as const, content: 'Set a food budget and show this month.' }];
const delta = (value: object) => ({ choices: [{ index: 0, delta: value }] });

describe('streamAskOpenAI', () => {
  it('assembles parallel tool calls from argument deltas split across chunks', async () => {
    fetchMock.mockResolvedValue(sseResponse([
      delta({ role: 'assistant', content: 'Checking… ' }),
      delta({ tool_calls: [{ index: 0, id: 'call_a', type: 'function', function: { name: 'set_category_budget', arguments: '' } }] }),
      delta({ tool_calls: [{ index: 0, function: { arguments: '{"category_id":"cat_food",' } }] }),
      delta({ tool_calls: [{ index: 1, id: 'call_b', type: 'function', function: { name: 'get_summary', arguments: '{}' } }] }),
      delta({ tool_calls: [{ index: 0, function: { arguments: '"amount":250}' } }] }),
      '[DONE]',
    ]) as any);
    const tokens: string[] = [];

    const response = await streamAskOpenAI('sk-test', MESSAGES, (token) => tokens.push(token));

    expect(response).toEqual({
      type: 'tool_calls',
      content: 'Checking… ',
      calls: [
        { id: 'call_a', name: 'set_category_budget', arguments: { category_id: 'cat_food', amount: 250 } },
        { id: 'call_b', name: 'get_summary', arguments: {} },
      ],
    });
    expect(tokens).toEqual(['Checking… ']);
  });

  it('returns plain text when no tool is called', async () => {
    fetchMock.mockResolvedValue(sseResponse([delta({ content: 'You spent ' }), delta({ content: '€42 on food.' }), '[DONE]']) as any);

    expect(await streamAskOpenAI('sk-test', MESSAGES, jest.fn())).toEqual({ type: 'text', content: 'You spent €42 on food.' });
  });
});
