import { parseSseBlock, parseSseEventsFromString } from './streaming';

describe('sse parser', () => {
  it('parses OpenAI-style data events (data-only, no event field)', () => {
    const input = [
      'data: {"choices":[{"delta":{"content":"Hel"}}]}',
      '',
      'data: {"choices":[{"delta":{"content":"lo"}}]}',
      '',
      'data: [DONE]',
      '',
    ].join('\n');

    expect(parseSseEventsFromString(input)).toEqual([
      { data: '{"choices":[{"delta":{"content":"Hel"}}]}' },
      { data: '{"choices":[{"delta":{"content":"lo"}}]}' },
      { data: '[DONE]' },
    ]);
  });

  it('parses Anthropic content_block_delta events (event + data)', () => {
    const input = [
      'event: content_block_delta',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}',
      '',
    ].join('\n');

    expect(parseSseEventsFromString(input)).toEqual([
      { event: 'content_block_delta', data: '{"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}' },
    ]);
  });

  it('joins multi-line data payloads', () => {
    const input = [
      'data: {"a":1',
      'data: ,"b":2}',
      '',
    ].join('\n');

    const events = parseSseEventsFromString(input);
    expect(events).toHaveLength(1);
    expect(events[0]?.data).toBe('{"a":1\n,"b":2}');
  });

  it('returns null for empty / irrelevant blocks', () => {
    expect(parseSseBlock('')).toBeNull();
    expect(parseSseBlock('data: ')).toBeNull();
    expect(parseSseBlock('event: foo')).toBeNull();
  });
});
