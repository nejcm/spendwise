import type { ShareIntent, ShareIntentFile } from 'expo-share-intent';
import { getSharedItem, isShareExtensionUrl, toNote } from './share-intent';

jest.mock('expo-share-intent', () => ({
  getScheme: () => 'spendwise',
  getShareExtensionKey: () => 'spendwiseShareKey',
}));

function intent(overrides: Partial<ShareIntent>): ShareIntent {
  return { files: null, text: null, webUrl: null, type: null, ...overrides };
}

function file(overrides: Partial<ShareIntentFile>): ShareIntentFile {
  return { fileName: 'shot.png', mimeType: 'image/png', path: 'file:///shot.png', size: 10, width: 1080, height: 2400, duration: null, ...overrides };
}

describe('getSharedItem', () => {
  it('takes the first image and skips other files', () => {
    const files = [file({ mimeType: 'application/pdf', path: 'file:///a.pdf' }), file({ path: 'file:///b.jpg', mimeType: 'image/jpeg' })];

    expect(getSharedItem(intent({ files }))).toEqual({ kind: 'image', uri: 'file:///b.jpg', width: 1080, height: 2400 });
  });

  it('takes trimmed text', () => {
    expect(getSharedItem(intent({ type: 'text', text: '  Paid €12.50 at Lidl \n' }))).toEqual({ kind: 'text', text: 'Paid €12.50 at Lidl' });
  });

  it.each([
    ['nothing', intent({})],
    ['blank text', intent({ text: '   ' })],
    ['a non-image file', intent({ files: [file({ mimeType: 'video/mp4' })] })],
  ])('finds nothing usable in %s', (_case: string, shareIntent: ShareIntent) => {
    expect(getSharedItem(shareIntent)).toBeNull();
  });
});

describe('toNote', () => {
  it('caps the text to the note limit', () => {
    expect(toNote('Paid €12.50')).toBe('Paid €12.50');
    expect(toNote('x'.repeat(600))).toBe('x'.repeat(500));
  });

  it('never cuts an emoji in half at the note limit', () => {
    const note = toNote(`${'x'.repeat(499)}💳 paid`);

    expect(note).toBe('x'.repeat(499));
    expect(() => encodeURIComponent(note)).not.toThrow();
  });
});

describe('isShareExtensionUrl', () => {
  it.each([
    'spendwise://dataUrl=spendwiseShareKey',
    'spendwise://dataUrl=spendwiseShareKey?nonce=ABC#text',
    'spendwise://dataUrl=spendwiseShareKey#media',
  ])('matches the share extension link %s', (url: string) => {
    expect(isShareExtensionUrl(url)).toBe(true);
  });

  it.each([
    'spendwise://transactions/new?note=dataUrl=spendwiseShareKey',
    'spendwise://dataUrl=spendwiseShareKeyX',
    'other://dataUrl=spendwiseShareKey',
    '/transactions/new',
  ])('leaves %s to the router', (url: string) => {
    expect(isShareExtensionUrl(url)).toBe(false);
  });
});
