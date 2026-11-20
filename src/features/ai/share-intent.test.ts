import type { ShareIntent, ShareIntentFile } from 'expo-share-intent';
import { isShareExtensionUrl, resolveShareAction } from './share-intent';

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

describe('resolveShareAction', () => {
  it('scans a shared image when scanning is on', () => {
    expect(resolveShareAction(intent({ type: 'media', files: [file({})] }), true))
      .toEqual({ kind: 'scan-image', uri: 'file:///shot.png', width: 1080, height: 2400 });
  });

  it('picks the first image and skips other files', () => {
    const files = [file({ mimeType: 'application/pdf', path: 'file:///a.pdf' }), file({ path: 'file:///b.jpg', mimeType: 'image/jpeg' })];

    expect(resolveShareAction(intent({ files }), true)).toMatchObject({ kind: 'scan-image', uri: 'file:///b.jpg' });
  });

  it('scans trimmed shared text when scanning is on', () => {
    expect(resolveShareAction(intent({ type: 'text', text: '  Paid €12.50 at Lidl \n' }), true))
      .toEqual({ kind: 'scan-text', text: 'Paid €12.50 at Lidl' });
  });

  it('opens an empty form for an image when scanning is off', () => {
    expect(resolveShareAction(intent({ files: [file({})] }), false)).toEqual({ kind: 'open-form' });
  });

  it('opens the form with the text as a note, capped to the note limit, when scanning is off', () => {
    expect(resolveShareAction(intent({ text: 'Paid €12.50' }), false)).toEqual({ kind: 'open-form', note: 'Paid €12.50' });
    expect(resolveShareAction(intent({ text: 'x'.repeat(600) }), false)).toEqual({ kind: 'open-form', note: 'x'.repeat(500) });
  });

  it.each([
    ['nothing', intent({})],
    ['blank text', intent({ text: '   ' })],
    ['a non-image file', intent({ files: [file({ mimeType: 'video/mp4' })] })],
  ])('ignores %s', (_case: string, shareIntent: ShareIntent) => {
    expect(resolveShareAction(shareIntent, true)).toBeNull();
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
