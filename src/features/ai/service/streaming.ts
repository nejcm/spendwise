export type SseEvent = {
  event?: string;
  data: string;
};

export type OnSseEvent = (event: SseEvent) => boolean | void | Promise<boolean | void>;

const NEWLINE_REGEXP = /\r\n/g;
const CR_REGEXP = /\r/g;
function normalizeNewlines(input: string) {
  return input.replace(NEWLINE_REGEXP, '\n').replace(CR_REGEXP, '\n');
}

export function parseSseBlock(block: string): SseEvent | null {
  const normalized = normalizeNewlines(block).trim();
  if (!normalized) return null;

  let event: string | undefined;
  const dataLines: string[] = [];

  for (const line of normalized.split('\n')) {
    if (!line) continue;
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      // SSE allows multiple data: lines; join them preserving newline boundaries.
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  const data = dataLines.join('\n');
  if (!data) return null;

  return { event, data };
}

const BLANK_LINE_REGEXP = /\n{2,}/g;
export function parseSseEventsFromString(input: string): SseEvent[] {
  const normalized = normalizeNewlines(input).trim();
  if (!normalized) return [];

  // SSE events are separated by a blank line.
  const blocks = normalized.split(BLANK_LINE_REGEXP);
  return blocks
    .map((b) => parseSseBlock(b))
    .filter((e): e is SseEvent => Boolean(e));
}

export async function streamSseEventsFromResponse(
  response: Response,
  { onEvent, signal }: { onEvent: OnSseEvent; signal?: AbortSignal },
): Promise<void> {
  const bodyAny = response.body as any;
  const canStream = Boolean(bodyAny?.getReader && typeof TextDecoder !== 'undefined');

  // Some Expo/RN fetch implementations don't expose a streaming body (no getReader()).
  // In that case, fall back to reading the full text and parsing it as SSE.
  if (!canStream) {
    const text = await response.text();
    const events = parseSseEventsFromString(text);
    for (const event of events) {
      if (signal?.aborted) throw new Error('Aborted');
      const shouldStop = await onEvent(event);
      if (shouldStop) return;
    }
    return;
  }

  // Note: React Native / Expo environments are often fetch-polyfilled; guard for stream support.
  const reader = bodyAny.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = normalizeNewlines(buffer);

    // Consume complete SSE blocks (terminated by a blank line).
    while (true) {
      const idx = buffer.indexOf('\n\n');
      if (idx === -1) break;

      const rawBlock = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const event = parseSseBlock(rawBlock);
      if (!event) continue;

      const shouldStop = await onEvent(event);
      if (shouldStop) {
        try {
          await reader.cancel();
        }
        catch {
          // ignore
        }
        return;
      }
    }

    if (signal?.aborted) {
      // Let AbortController error semantics be handled by callers if they rely on it.
      throw new Error('Aborted');
    }
  }

  // Best-effort parse remaining buffered data.
  const tail = buffer.trim();
  if (tail) {
    const event = parseSseBlock(tail);
    if (event) await onEvent(event);
  }
}
