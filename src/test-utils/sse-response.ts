/** A streamed `fetch` Response whose SSE body arrives one byte per read, splitting every event and multi-byte character. */
export function sseResponse(events: readonly unknown[]): Response {
  const bytes = new TextEncoder().encode(events.map((data) => `data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`).join(''));
  let offset = 0;
  const reader = {
    read: async () => {
      if (offset >= bytes.length) return { done: true, value: undefined };
      const value = bytes.slice(offset, offset + 1);
      offset += 1;
      return { done: false, value };
    },
  };
  return { ok: true, status: 200, body: { getReader: () => reader } } as unknown as Response;
}

export function errorResponse(status: number, body: string): Response {
  return { ok: false, status, text: async () => body } as unknown as Response;
}
